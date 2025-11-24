// services/redisService.js
const { logger } = require("../utils/logger");

/**
 * Verificar si Redis está configurado correctamente
 * Debe tener REDIS_HOST con un valor real (no localhost, no vacío)
 */
const REDIS_HOST = process.env.REDIS_HOST;
const isRedisConfigured = !!(
  REDIS_HOST &&
  REDIS_HOST.trim() !== "" &&
  REDIS_HOST !== "localhost" &&
  REDIS_HOST !== "127.0.0.1" &&
  REDIS_HOST.includes(".")  // Debe ser un dominio real como xxx.upstash.io
);

// Log inmediato para debug
console.log(`[Redis Config] REDIS_HOST="${REDIS_HOST}", isRedisConfigured=${isRedisConfigured}`);

let Redis = null;
let redisClient = null;
let redisPub = null;
let redisSub = null;
let redisAvailable = false;

/**
 * Inicializar Redis (solo si está configurado)
 */
async function initRedis() {
  if (!isRedisConfigured) {
    logger.warn("⚠️ Redis no configurado - funcionando sin cache (esto es normal si no tienes Upstash)");
    return false;
  }

  try {
    // Solo importar ioredis si realmente vamos a usarlo
    Redis = require("ioredis");

    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        if (times > 3) return null; // Dejar de reintentar después de 3 intentos
        return Math.min(times * 100, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
    };

    redisClient = new Redis(redisConfig);
    redisPub = new Redis(redisConfig);
    redisSub = new Redis(redisConfig);

    // Eventos de conexión
    redisClient.on("connect", () => {
      logger.info("✅ Redis client conectado");
    });

    redisClient.on("ready", () => {
      logger.info("🟢 Redis client listo");
      redisAvailable = true;
    });

    redisClient.on("error", (err) => {
      logger.error(`❌ Redis error: ${err.message}`);
      redisAvailable = false;
    });

    redisClient.on("close", () => {
      logger.warn("⚠️ Redis conexión cerrada");
      redisAvailable = false;
    });

    redisPub.on("error", (err) => {
      logger.error(`❌ Redis Pub error: ${err.message}`);
    });

    redisSub.on("error", (err) => {
      logger.error(`❌ Redis Sub error: ${err.message}`);
    });

    // Intentar conectar
    await redisClient.connect();
    await redisPub.connect();
    await redisSub.connect();

    redisAvailable = true;
    logger.info("✅ Redis inicializado correctamente");
    return true;
  } catch (err) {
    logger.warn(`⚠️ No se pudo conectar a Redis: ${err.message} - funcionando sin cache`);
    redisClient = null;
    redisPub = null;
    redisSub = null;
    redisAvailable = false;
    return false;
  }
}

// Inicializar Redis en background (no bloquea el servidor)
if (isRedisConfigured) {
  initRedis().catch(() => {});
} else {
  logger.warn("⚠️ Redis deshabilitado - no hay REDIS_HOST configurado");
}

/**
 * Cache helpers
 */
const cache = {
  /**
   * Obtener valor del cache
   */
  async get(key) {
    if (!redisAvailable || !redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Error getting cache key ${key}:`, err);
      return null;
    }
  },

  /**
   * Establecer valor en cache con TTL opcional
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!redisAvailable || !redisClient) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      logger.error(`Error setting cache key ${key}:`, err);
      return false;
    }
  },

  /**
   * Eliminar clave del cache
   */
  async del(key) {
    if (!redisAvailable || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.error(`Error deleting cache key ${key}:`, err);
      return false;
    }
  },

  /**
   * Eliminar múltiples claves por patrón
   */
  async delPattern(pattern) {
    if (!redisAvailable || !redisClient) return 0;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return keys.length;
    } catch (err) {
      logger.error(`Error deleting cache pattern ${pattern}:`, err);
      return 0;
    }
  },

  /**
   * Verificar si existe una clave
   */
  async exists(key) {
    if (!redisAvailable || !redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (err) {
      logger.error(`Error checking cache key ${key}:`, err);
      return false;
    }
  },

  /**
   * Incrementar contador
   */
  async incr(key, amount = 1) {
    if (!redisAvailable || !redisClient) return null;
    try {
      return await redisClient.incrby(key, amount);
    } catch (err) {
      logger.error(`Error incrementing cache key ${key}:`, err);
      return null;
    }
  },

  /**
   * Cache con función de fallback
   * Si no existe en cache, ejecuta fn y guarda el resultado
   */
  async getOrSet(key, fn, ttlSeconds = 3600) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug(`Cache HIT: ${key}`);
        return cached;
      }

      logger.debug(`Cache MISS: ${key}`);
      const value = await fn();
      await this.set(key, value, ttlSeconds);
      return value;
    } catch (err) {
      logger.error(`Error in getOrSet for key ${key}:`, err);
      // Si falla el cache, ejecutar fn directamente
      return await fn();
    }
  },
};

/**
 * Helpers específicos para batallas
 */
const battleCache = {
  /**
   * Cache de detalles de batalla
   */
  async getBattle(battleId) {
    return await cache.get(`battle:${battleId}`);
  },

  async setBattle(battleId, battleData, ttl = 300) {
    // 5 minutos
    return await cache.set(`battle:${battleId}`, battleData, ttl);
  },

  async invalidateBattle(battleId) {
    return await cache.del(`battle:${battleId}`);
  },

  /**
   * Cache de lista de batallas
   */
  async getBattleList(filters = {}) {
    const key = `battles:list:${JSON.stringify(filters)}`;
    return await cache.get(key);
  },

  async setBattleList(filters, battles, ttl = 60) {
    // 1 minuto
    const key = `battles:list:${JSON.stringify(filters)}`;
    return await cache.set(key, battles, ttl);
  },

  /**
   * Invalidar todos los caches de batallas
   */
  async invalidateAll() {
    const deleted = await cache.delPattern("battle:*");
    logger.info(`Invalidados ${deleted} caches de batallas`);
    return deleted;
  },
};

/**
 * Helpers específicos para usuarios
 */
const userCache = {
  async getUser(userId) {
    return await cache.get(`user:${userId}`);
  },

  async setUser(userId, userData, ttl = 600) {
    // 10 minutos
    return await cache.set(`user:${userId}`, userData, ttl);
  },

  async invalidateUser(userId) {
    return await cache.del(`user:${userId}`);
  },
};

/**
 * Rate limiting con Redis
 */
const rateLimiter = {
  /**
   * Verificar y actualizar límite de rate
   */
  async checkLimit(key, maxRequests, windowSeconds) {
    // Si Redis no está disponible, permitir (fail open)
    if (!redisAvailable || !redisClient) {
      return { allowed: true, current: 0, remaining: maxRequests };
    }
    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      return {
        allowed: current <= maxRequests,
        current,
        remaining: Math.max(0, maxRequests - current),
      };
    } catch (err) {
      logger.error(`Error in rate limiter for key ${key}:`, err);
      // En caso de error, permitir la request (fail open)
      return { allowed: true, current: 0, remaining: maxRequests };
    }
  },
};

/**
 * Cerrar conexiones
 */
async function closeConnections() {
  if (!redisAvailable) return;
  logger.info("Cerrando conexiones Redis...");
  if (redisClient) await redisClient.quit();
  if (redisPub) await redisPub.quit();
  if (redisSub) await redisSub.quit();
  logger.info("Conexiones Redis cerradas");
}

// Manejar cierre graceful
process.on("SIGTERM", closeConnections);
process.on("SIGINT", closeConnections);

/**
 * Getters para clientes Redis (pueden ser null)
 */
const getRedisClient = () => redisClient;
const getRedisPub = () => redisPub;
const getRedisSub = () => redisSub;
const isRedisAvailable = () => redisAvailable;

module.exports = {
  redisClient,
  redisPub,
  redisSub,
  getRedisClient,
  getRedisPub,
  getRedisSub,
  isRedisAvailable,
  initRedis,
  cache,
  battleCache,
  userCache,
  rateLimiter,
  closeConnections,
};
