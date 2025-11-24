// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { createLimiter } = require("../middleware/security");
const {
  createPlanValidation,
  checkoutValidation,
} = require("../middleware/validators");

// ===================================================================
// PLANES
// ===================================================================

// Crear plan (solo admin) - con validación
router.post(
  "/plan",
  authMiddleware,
  requireRole("admin"),
  createPlanValidation,
  paymentController.createPlan
);

// Listar planes - público
router.get("/plans", paymentController.listPlans);

// ===================================================================
// CHECKOUT MERCADOPAGO
// ===================================================================

// Crear preferencia de pago MercadoPago
router.post(
  "/checkout",
  authMiddleware,
  createLimiter,
  checkoutValidation,
  paymentController.createCheckout
);

// Webhook de MercadoPago (IPN) - NO requiere auth
// MercadoPago envía notificaciones aquí cuando se procesa un pago
router.post("/webhook/mercadopago", paymentController.mpWebhook);

// También escuchar en /webhook por compatibilidad
router.post("/webhook", paymentController.mpWebhook);

// ===================================================================
// SUSCRIPCIÓN
// ===================================================================

// Obtener suscripción del usuario actual
router.get("/subscription", authMiddleware, paymentController.getSubscription);

// Verificar estado de un pago específico
router.get("/verify/:paymentId", authMiddleware, paymentController.verifyPayment);

// Cancelar suscripción
router.post("/cancel", authMiddleware, paymentController.cancelSubscription);

module.exports = router;
