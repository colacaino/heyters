// utils/logger.js
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// Niveles de log personalizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para cada nivel
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(logColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, "..", "logs");

// Transport para archivos con rotación diaria
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m", // 20MB por archivo
  maxFiles: "14d", // Mantener logs 14 días
  format: logFormat,
  level: "info",
});

// Transport para errores
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "30d", // Mantener errores 30 días
  format: logFormat,
  level: "error",
});

// Transport para la consola
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.LOG_LEVEL || "debug",
});

// Crear el logger principal
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports: [
    consoleTransport,
    dailyRotateFileTransport,
    errorFileTransport,
  ],
  // No mostrar logs en testing
  silent: process.env.NODE_ENV === "test",
  // Salir al tener un error
  exitOnError: false,
});

/**
 * Logger específico para HTTP requests (Morgan integration)
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

/**
 * Helper para loguear eventos de batalla
 */
logger.battle = (battleId, action, details = {}) => {
  logger.info(`[BATTLE:${battleId}] ${action}`, {
    battleId,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para loguear eventos de autenticación
 */
logger.auth = (userId, action, details = {}) => {
  logger.info(`[AUTH] User ${userId} - ${action}`, {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para loguear eventos de pago
 */
logger.payment = (userId, action, amount, details = {}) => {
  logger.info(`[PAYMENT] User ${userId} - ${action} - $${amount}`, {
    userId,
    action,
    amount,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para loguear eventos de Socket.IO
 */
logger.socket = (socketId, event, details = {}) => {
  logger.debug(`[SOCKET:${socketId}] ${event}`, {
    socketId,
    event,
    ...details,
  });
};

/**
 * Helper para loguear eventos de seguridad
 */
logger.security = (severity, message, details = {}) => {
  const logLevel = severity === "high" ? "error" : "warn";
  logger[logLevel](`[SECURITY] ${message}`, {
    severity,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para loguear queries lentas de DB
 */
logger.slowQuery = (query, duration, details = {}) => {
  logger.warn(`[SLOW QUERY] ${duration}ms - ${query}`, {
    query,
    duration,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware de Morgan con Winston
 */
const morganFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

module.exports = {
  logger,
  morganFormat,
};
