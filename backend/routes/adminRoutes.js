// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/proMiddleware");

// Todas las rutas requieren autenticación + ser admin
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Usuarios
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUserAdmin);
router.put("/users/:id", adminController.updateUserAdmin);
router.delete("/users/:id", adminController.deleteUserAdmin);
router.put("/users/:id/toggle-pro", adminController.toggleUserPro);

// Event requests
router.get("/event-requests", adminController.getEventRequestsAdmin);
router.patch("/event-requests/:id", adminController.updateEventRequestAdmin);

// Estadísticas
router.get("/stats/growth", adminController.getGrowthStats);

module.exports = router;
