// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { logger, morganFormat } = require("./utils/logger");
const { getRedisPub, getRedisSub, isRedisAvailable } = require("./services/redisService");
const db = require("./db");

// Middleware de seguridad
const {
  getCorsOptions,
  sanitizeData,
  preventHPP,
  xssProtection,
  securityHeaders,
  generalLimiter,
} = require("./middleware/security");

const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");

// Servicios WebRTC y Notificaciones
const { registerSocket, setupBattleSignaling } = require("./services/webrtcService");
const { registerSocketIO } = require("./services/notificationService");
const { registerBattleRealtime } = require("./services/battleRealtimeService");

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const battleRoutes = require("./routes/battleRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const app = express();

// ===================================================================
// CONFIGURACIÓN EXPRESS - SEGURIDAD MEJORADA
// ===================================================================

// Trust proxy (necesario para rate limiting detrás de load balancers)
app.set("trust proxy", 1);

// CORS configurado con whitelist
app.use(cors(getCorsOptions()));

// Compresión gzip para respuestas
app.use(compression());

// Helmet para headers de seguridad (con COEP/COOP deshabilitados para permitir media)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // Usamos nuestro propio CSP en securityHeaders
}));

// Headers de seguridad adicionales
app.use(securityHeaders);

// Body parser con límite
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Archivos estáticos para media (beats locales, etc.) con CORS habilitado
app.use("/media", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "public")));

// Sanitización de datos
app.use(sanitizeData);

// Prevención de HTTP Parameter Pollution
app.use(preventHPP);

// Protección XSS
app.use(xssProtection);

// Logging con Winston + Morgan
app.use(morgan(morganFormat, { stream: logger.stream }));

// Rate limiting general
app.use(generalLimiter);

// ===================================================================
// RUTAS
// ===================================================================
app.use("/api/auth", authRoutes);
app.use("/api/battles", battleRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint para monitoreo
app.get("/health", async (req, res) => {
  const healthcheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  try {
    // Check PostgreSQL
    const dbHealth = await db.healthCheck();
    healthcheck.services.database = dbHealth.connected ? "healthy" : "unhealthy";
    healthcheck.services.dbPool = dbHealth.pool;
  } catch (err) {
    healthcheck.services.database = "unhealthy";
    healthcheck.status = "degraded";
  }

  try {
    // Check Redis (opcional)
    if (isRedisAvailable()) {
      const redisClient = require("./services/redisService").getRedisClient();
      if (redisClient) {
        await redisClient.ping();
        healthcheck.services.redis = "healthy";
      } else {
        healthcheck.services.redis = "not_configured";
      }
    } else {
      healthcheck.services.redis = "not_configured";
    }
  } catch (err) {
    healthcheck.services.redis = "unhealthy";
    // Redis es opcional, no degradar el status
  }

  const httpStatus = healthcheck.status === "ok" ? 200 : 503;
  res.status(httpStatus).json(healthcheck);
});

// Ruta simple de prueba
app.get("/", (req, res) => {
  res.json({
    message: "Heyters API funcionando correctamente",
    status: "ok",
    timestamp: new Date(),
  });
});

// ===================================================================
// MANEJO DE ERRORES GLOBAL - MEJORADO
// ===================================================================

// Manejar rutas no encontradas (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// ===================================================================
// SOCKET.IO + WebRTC - CONFIGURACIÓN SEGURA
// ===================================================================
const server = http.createServer(app);

// Socket.IO con CORS configurado
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB max payload
  transports: ["websocket", "polling"],
});

// Redis adapter para escalar Socket.IO horizontalmente (solo si Redis está disponible)
if (isRedisAvailable()) {
  const redisPub = getRedisPub();
  const redisSub = getRedisSub();
  if (redisPub && redisSub) {
    io.adapter(createAdapter(redisPub, redisSub));
    logger.info("✅ Socket.IO configurado con Redis adapter");
  }
} else {
  logger.warn("⚠️ Socket.IO funcionando sin Redis adapter (modo single-server)");
}

// Registrar la instancia de Socket.IO en servicios
registerSocket(io);
registerSocketIO(io);
registerBattleRealtime(io);

// Manejar señalización WebRTC
setupBattleSignaling();

// Control de rooms por usuario con logging mejorado
io.on("connection", (socket) => {
  logger.socket(socket.id, "connected", {
    transport: socket.conn.transport.name,
    address: socket.handshake.address
  });

  // Registrar usuario en su propio canal para notificaciones push
  socket.on("user:register", (userId) => {
    const room = `user_${userId}`;
    socket.join(room);
    logger.socket(socket.id, "user_registered", { userId, room });
  });

  socket.on("disconnect", (reason) => {
    logger.socket(socket.id, "disconnected", { reason });
  });

  socket.on("error", (error) => {
    logger.error(`Socket error: ${error.message}`, {
      socketId: socket.id,
      error: error.stack
    });
  });
});

// ===================================================================
// INICIAR SERVIDOR
// ===================================================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`🚀 Servidor Heyters iniciado en puerto ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
  });
});
