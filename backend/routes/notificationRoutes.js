// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// Obtener notificaciones
router.get("/", authMiddleware, notificationController.listNotifications);

// Marcar UNA como leída
router.post("/read/:notificationId", authMiddleware, notificationController.readOne);

// Marcar TODAS como leídas
router.post("/read-all", authMiddleware, notificationController.readAll);

// Enviar notificación manual (admin)
router.post("/send", authMiddleware, requireRole("admin"), notificationController.sendNotification);

// Enviar masivamente (admin)
router.post("/send-many", authMiddleware, requireRole("admin"), notificationController.sendNotificationToMany);

module.exports = router;
