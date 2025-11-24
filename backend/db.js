// db.js
const { Pool } = require("pg");
const { logger } = require("./utils/logger");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error(
    "❌ DATABASE_URL no encontrada en .env. Configura tu conexión a PostgreSQL."
  );
  throw new Error("DATABASE_URL is required");
}

/**
 * Configuración optimizada del pool de conexiones
 */
const pool = new Pool({
  connectionString,

  // Pool configuration
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Máximo de conexiones
  min: parseInt(process.env.DB_POOL_MIN) || 2, // Mínimo de conexiones
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // 30s
  connectionTimeoutMillis:
    parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // 10s

  // SSL configuration
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : false,

  // Application name para identificar en logs de PostgreSQL
  application_name: process.env.DB_APP_NAME || "heyters-backend",
});

/**
 * Helper optimizado para consultas con logging y métricas
 */
const query = async (text, params = []) => {
  const start = Date.now();
  const client = await pool.connect();

  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;

    // Log de queries lentas (> 1 segundo)
    if (duration > 1000) {
      logger.slowQuery(text.substring(0, 100), duration, {
        params: params?.length || 0,
        rows: res.rowCount,
      });
    }

    // Log debug de todas las queries en desarrollo
    if (process.env.NODE_ENV === "development") {
      logger.debug(`[DB] Query: ${text.substring(0, 50)}... (${duration}ms)`, {
        duration,
        rows: res.rowCount,
      });
    }

    return res;
  } catch (error) {
    logger.error(`[DB] Query error: ${error.message}`, {
      query: text.substring(0, 100),
      error: error.stack,
    });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Helper para transacciones
 */
const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    logger.debug("[DB] Transaction committed");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("[DB] Transaction rolled back", { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtener estadísticas del pool
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
};

/**
 * Health check de la base de datos
 */
const healthCheck = async () => {
  try {
    const result = await query("SELECT NOW() as time, version() as version");
    return {
      healthy: true,
      timestamp: result.rows[0].time,
      version: result.rows[0].version,
      pool: getPoolStats(),
    };
  } catch (error) {
    logger.error("[DB] Health check failed", { error: error.message });
    return {
      healthy: false,
      error: error.message,
    };
  }
};

// Event handlers del pool
pool.on("connect", (client) => {
  logger.debug("[DB] Nueva conexión establecida al pool");
});

pool.on("acquire", (client) => {
  logger.debug("[DB] Cliente adquirido del pool", { stats: getPoolStats() });
});

pool.on("remove", (client) => {
  logger.info("[DB] Cliente removido del pool", { stats: getPoolStats() });
});

pool.on("error", (err, client) => {
  logger.error("[DB] Error inesperado en el pool de PostgreSQL", {
    error: err.message,
    stack: err.stack,
  });
});

// Log inicial de conexión
pool
  .connect()
  .then((client) => {
    logger.info("✅ Conexión a PostgreSQL establecida", {
      database: client.database,
      user: client.user,
      host: client.host,
      port: client.port,
    });
    client.release();
  })
  .catch((err) => {
    logger.error("❌ Error conectando a PostgreSQL", {
      error: err.message,
      stack: err.stack,
    });
  });

// Graceful shutdown
const closePool = async () => {
  logger.info("Cerrando pool de PostgreSQL...");
  await pool.end();
  logger.info("Pool de PostgreSQL cerrado");
};

process.on("SIGTERM", closePool);
process.on("SIGINT", closePool);

module.exports = {
  query,
  transaction,
  pool,
  getPoolStats,
  healthCheck,
  closePool,
};
