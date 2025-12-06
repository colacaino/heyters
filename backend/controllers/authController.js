// controllers/authController.js
const authService = require("../services/authService");
const { findUserById } = require("../models/userModel");
const { logger } = require("../utils/logger");
const emailService = require("../services/emailService");

/* ===========================================================
   HELPER: RESPUESTAS UNIFICADAS
=========================================================== */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/**
 * Helper para establecer cookie de refresh token
 * httpOnly: previene acceso desde JavaScript (protección XSS)
 * secure: solo HTTPS en producción
 * sameSite: protección CSRF
 */
function setRefreshTokenCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // No accesible desde JavaScript
    secure: isProduction, // Solo HTTPS en producción
    sameSite: isProduction ? "strict" : "lax", // Protección CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    path: "/api/auth", // Solo disponible en rutas de auth
  });
}

/**
 * Helper para limpiar cookie de refresh token
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "/api/auth",
  });
}

/* ===========================================================
   REGISTRO
=========================================================== */
exports.register = async (req, res) => {
  try {
    const { username, displayName, email, password, role, bio, country, city } = req.body;

    if (!username || !email || !password) {
      return send(res, 400, false, "Username, email y password son obligatorios");
    }

    const user = await authService.register({
      username,
      displayName: displayName || username, // Usa username como displayName si no se proporciona
      email,
      password,
      role,
      bio,
      country,
      city,
    });

    // Enviar email de verificación (no bloqueante)
    emailService
      .sendVerificationEmail(user.id, user.email, user.username)
      .catch((err) => {
        logger.error("Error enviando email de verificación:", err);
      });

    return send(res, 201, true, "Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.", {
      user,
    });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   LOGIN
=========================================================== */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return send(res, 400, false, "Faltan credenciales");
    }

    const { user, accessToken, refreshToken } = await authService.login({
      identifier,
      password,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    // Establecer refresh token en httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    // Solo retornar user y accessToken (refresh token está en cookie)
    return send(res, 200, true, "Login exitoso", {
      user,
      accessToken,
    });
  } catch (err) {
    // Log detallado del error para debugging
    logger.error(`[LOGIN ERROR] ${err.message}`, {
      identifier: req.body.identifier,
      error: err.stack,
    });
    return send(res, 401, false, err.message);
  }
};

/* ===========================================================
   REFRESCAR ACCESS TOKEN
=========================================================== */
exports.refresh = async (req, res) => {
  try {
    // Intentar obtener refresh token de cookie primero, luego de body (backward compatibility)
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return send(res, 400, false, "No se proporcionó refreshToken");
    }

    const newAccessToken = await authService.refreshAccessToken(refreshToken);

    return send(res, 200, true, "Access token refrescado", {
      accessToken: newAccessToken,
    });
  } catch (err) {
    return send(res, 401, false, err.message);
  }
};

/* ===========================================================
   LOGOUT
=========================================================== */
exports.logout = async (req, res) => {
  try {
    // Intentar obtener de cookie primero, luego de body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return send(res, 400, false, "No se proporcionó refreshToken");
    }

    await authService.logout(refreshToken);

    // Limpiar cookie
    clearRefreshTokenCookie(res);

    return send(res, 200, true, "Sesión cerrada correctamente");
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   LOGOUT GLOBAL (revoca todos los tokens)
=========================================================== */
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId; // viene del middleware auth

    await authService.logoutAll(userId);

    // Limpiar cookie
    clearRefreshTokenCookie(res);

    return send(res, 200, true, "Todas las sesiones fueron cerradas");
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   OBTENER USUARIO ACTUAL
=========================================================== */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await findUserById(userId);

    if (!user) return send(res, 404, false, "Usuario no encontrado");

    return send(res, 200, true, "Usuario encontrado", { user });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   REENVIAR EMAIL DE VERIFICACIÓN
=========================================================== */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await findUserById(userId);

    if (!user) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    if (user.isVerified) {
      return send(res, 400, false, "Tu cuenta ya está verificada");
    }

    await emailService.sendVerificationEmail(user.id, user.email, user.username);

    return send(res, 200, true, "Email de verificación enviado. Revisa tu bandeja de entrada.");
  } catch (err) {
    logger.error("Error reenviando email de verificación:", err);
    return send(res, 500, false, "Error al enviar el email de verificación");
  }
};

/* ===========================================================
   VERIFICAR EMAIL
=========================================================== */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return send(res, 400, false, "Token de verificación requerido");
    }

    await emailService.verifyEmail(token);

    return send(res, 200, true, "Email verificado exitosamente. Ya puedes usar todas las funciones de Heyters.");
  } catch (err) {
    logger.error("Error verificando email:", err);
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   SOLICITAR RECUPERACIÓN DE CONTRASEÑA
=========================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return send(res, 400, false, "Email requerido");
    }

    await emailService.sendPasswordResetEmail(email);

    // Por seguridad, siempre retornamos el mismo mensaje
    return send(
      res,
      200,
      true,
      "Si el email está registrado, recibirás un enlace de recuperación en tu bandeja de entrada."
    );
  } catch (err) {
    logger.error("Error en forgot password:", err);
    return send(res, 500, false, "Error al procesar la solicitud");
  }
};

/* ===========================================================
   RESTABLECER CONTRASEÑA
=========================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return send(res, 400, false, "Token de recuperación requerido");
    }

    if (!password || password.length < 6) {
      return send(res, 400, false, "La contraseña debe tener al menos 6 caracteres");
    }

    await emailService.resetPassword(token, password);

    return send(res, 200, true, "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.");
  } catch (err) {
    logger.error("Error reseteando contraseña:", err);
    return send(res, 400, false, err.message);
  }
};
