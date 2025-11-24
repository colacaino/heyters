// routes/achievementRoutes.js
const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// Crear logro (admin)
router.post("/create", authMiddleware, requireRole("admin"), achievementController.createAchievement);

// Listar todos los logros
router.get("/", achievementController.listAchievements);

// Desbloquear logro
router.post("/unlock", authMiddleware, achievementController.unlockAchievement);

// Incrementar progreso
router.post("/increment", authMiddleware, achievementController.incrementProgress);

// Logros del usuario actual
router.get("/my-achievements", authMiddleware, achievementController.getUserAchievements);

module.exports = router;
