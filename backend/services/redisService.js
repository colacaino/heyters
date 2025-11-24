// services/redisService.js
const Redis = require("ioredis");
const { logger } = require("../utils/logger");

/**
 * Configuración de Redis
 */
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

/**
 * Cliente principal de Redis
 */
const redisClient = new Redis(redisConfig);

/**
 * Cliente para Pub/Sub (Socket.IO)
 */
const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);

// Eventos de conexión
redisClient.on("connect", () => {
  logger.info("✅ Redis client conectado");
});

redisClient.on("ready", () => {
  logger.info("🟢 Redis client listo");
});

redisClient.on("error", (err) => {
  logger.error(`❌ Redis error: ${err.message}`, { error: err.stack });
});

redisClient.on("close", () => {
  logger.warn("⚠️ Redis conexión cerrada");
});

redisPub.on("error", (err) => {
  logger.error(`❌ Redis Pub error: ${err.message}`);
});

redisSub.on("error", (err) => {
  logger.error(`❌ Redis Sub error: ${err.message}`);
});

/**
 * Cache helpers
 */
const cache = {
  /**
   * Obtener valor del cache
   */
  async get(key) {
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
  logger.info("Cerrando conexiones Redis...");
  await redisClient.quit();
  await redisPub.quit();
  await redisSub.quit();
  logger.info("Conexiones Redis cerradas");
}

// Manejar cierre graceful
process.on("SIGTERM", closeConnections);
process.on("SIGINT", closeConnections);

module.exports = {
  redisClient,
  redisPub,
  redisSub,
  cache,
  battleCache,
  userCache,
  rateLimiter,
  closeConnections,
};
