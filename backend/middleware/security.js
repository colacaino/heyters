// middleware/security.js
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

/**
 * Rate limiter general para todas las rutas
 * DESACTIVADO PARA GRABAR VIDEO
 */
const generalLimiter = (req, res, next) => next(); // BYPASS COMPLETO

/**
 * Rate limiter estricto para autenticación
 * DESACTIVADO PARA GRABAR VIDEO
 */
const authLimiter = (req, res, next) => next(); // BYPASS COMPLETO

/**
 * Rate limiter para creación de recursos
 * DESACTIVADO PARA GRABAR VIDEO
 */
const createLimiter = (req, res, next) => next(); // BYPASS COMPLETO

/**
 * Rate limiter para votación
 * DESACTIVADO PARA GRABAR VIDEO
 */
const voteLimiter = (req, res, next) => next(); // BYPASS COMPLETO

/**
 * Configuración CORS segura
 * En producción, cambiar allowedOrigins a dominios específicos
 */
const getCorsOptions = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

  return {
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 600, // Cache preflight 10 minutos
  };
};

/**
 * Sanitización contra NoSQL injection
 * Aunque usamos PostgreSQL, previene ataques en campos JSONB
 */
const sanitizeData = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Dato sanitizado - Key: ${key} en ${req.path}`);
  },
});

/**
 * Protección contra HTTP Parameter Pollution
 * Previene arrays duplicados en query params
 */
const preventHPP = hpp({
  whitelist: [
    "status",
    "visibility",
    "mode",
    "language",
    "role",
    "type",
    "sort",
  ],
});

/**
 * Middleware para sanitizar strings contra XSS
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;

  return str
    .replace(/[<>]/g, "") // Remove < >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

/**
 * Middleware para limpiar body de XSS
 */
const xssProtection = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  next();
};

/**
 * Headers de seguridad adicionales
 */
const securityHeaders = (req, res, next) => {
  // Prevenir clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevenir MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Habilitar XSS filter del browser
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy básico
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; media-src 'self' https: blob:; connect-src 'self' https: wss:;"
  );

  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  voteLimiter,
  getCorsOptions,
  sanitizeData,
  preventHPP,
  xssProtection,
  securityHeaders,
};
