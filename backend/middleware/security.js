// middleware/security.js
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

/**
 * Rate limiter general para todas las rutas
 * Más permisivo en desarrollo para facilitar testing
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 100 : 10000, // 10000 en dev, 100 en prod
  message: {
    success: false,
    message: "Demasiadas solicitudes desde esta IP, por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter estricto para autenticación
 * Más permisivo en desarrollo
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 5 : 100, // 100 en dev, 5 en prod
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Demasiados intentos de autenticación. Intenta en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para creación de recursos
 * Más permisivo en desarrollo
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === "production" ? 20 : 1000, // 1000 en dev, 20 en prod
  message: {
    success: false,
    message: "Has alcanzado el límite de creación. Intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para votación
 * Previene manipulación de votos
 */
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 votos por minuto
  message: {
    success: false,
    message: "Estás votando demasiado rápido. Espera un momento.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
