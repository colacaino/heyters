// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/security");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validators");

// Registro - con rate limiting y validación
router.post(
  "/register",
  authLimiter,
  registerValidation,
  authController.register
);

// Login - con rate limiting y validación
router.post("/login", authLimiter, loginValidation, authController.login);

// Refresh token - con rate limiting moderado
router.post("/refresh", authLimiter, authController.refresh);

// Logout
router.post("/logout", authController.logout);

// Logout global - requiere autenticación
router.post("/logout-all", authMiddleware, authController.logoutAll);

// Usuario actual - requiere autenticación
router.get("/me", authMiddleware, authController.getMe);

// Verificación de email
router.post(
  "/resend-verification",
  authMiddleware,
  authController.resendVerificationEmail
);
router.get("/verify-email/:token", authController.verifyEmail);

// Recuperación de contraseña
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password/:token", authLimiter, authController.resetPassword);

module.exports = router;
