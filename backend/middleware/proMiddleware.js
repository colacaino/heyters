// middleware/proMiddleware.js
const { findUserById } = require("../models/userModel");

/**
 * Middleware que requiere que el usuario sea Pro
 * Debe usarse después de authMiddleware
 */
const requirePro = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Autenticación requerida",
      });
    }

    const user = await findUserById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (!user.isPro && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Esta función requiere una cuenta Pro",
        code: "PRO_REQUIRED",
      });
    }

    // Si el usuario tiene fecha de expiración y ya pasó
    if (user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Tu suscripción Pro ha expirado",
        code: "PRO_EXPIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Error en requirePro:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar estado Pro",
    });
  }
};

/**
 * Middleware que requiere que el usuario sea Admin
 * Debe usarse después de authMiddleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Autenticación requerida",
      });
    }

    const user = await findUserById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Se requiere rol de administrador",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Error en requireAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar permisos de admin",
    });
  }
};

/**
 * Middleware opcional que adjunta info de Pro al request
 * No bloquea, solo agrega req.isPro y req.isAdmin
 */
const attachProStatus = async (req, res, next) => {
  try {
    if (req.userId) {
      const user = await findUserById(req.userId);
      if (user) {
        req.isPro = user.isPro;
        req.isAdmin = user.isAdmin;
        req.userRole = user.role;
      }
    }
    next();
  } catch (error) {
    // No bloquear, solo continuar
    next();
  }
};

module.exports = {
  requirePro,
  requireAdmin,
  attachProStatus,
};
