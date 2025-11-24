// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Verifica el Access Token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token no proporcionado",
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Formato de token inválido",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    req.userId = decoded.userId; // Para compatibilidad con otros middlewares
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}

/**
 * Middleware para verificar rol (admin)
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "No autorizado",
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
