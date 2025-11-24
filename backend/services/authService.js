// services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const { logger } = require("../utils/logger");

const {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  updateLastLogin,
} = require("../models/userModel");

require("dotenv").config();

/* ===========================================================
   HELPERS
=========================================================== */

/**
 * Genera un JWT acces token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
}

/**
 * Genera un refresh token, con almacenamiento en DB
 */
async function generateRefreshToken(userId, userAgent, ip) {
  const token = crypto.randomBytes(48).toString("hex");

  const query = `
    INSERT INTO refresh_tokens (
      user_id, token, user_agent, ip_address, expires_at
    )
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
    RETURNING *;
  `;

  await db.query(query, [userId, token, userAgent, ip]);
  return token;
}

/**
 * Revoca refresh token individual
 */
async function revokeRefreshToken(token) {
  await db.query(
    `UPDATE refresh_tokens SET is_revoked = TRUE, revoked_at = NOW() WHERE token = $1`,
    [token]
  );
}

/**
 * Revoca todos los refresh tokens de un usuario (logout global)
 */
async function revokeAllRefreshTokens(userId) {
  await db.query(
    `UPDATE refresh_tokens SET is_revoked = TRUE, revoked_at = NOW() WHERE user_id = $1`,
    [userId]
  );
}

/* ===========================================================
   SERVICIOS PRINCIPALES
=========================================================== */

/**
 * Registro de usuario
 */
async function register({ username, email, password, displayName = null }) {
  // Validar existencia previa
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    logger.security("low", "Intento de registro con email duplicado", { email });
    throw new Error("El email ya está registrado");
  }

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    logger.security("low", "Intento de registro con username duplicado", { username });
    throw new Error("El username ya existe");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await createUser({
    username,
    displayName: displayName || username,
    email,
    passwordHash,
    role: "basic", // Roles válidos: 'basic', 'pro', 'admin'
  });

  logger.auth(newUser.id, "user_registered", {
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  });

  return newUser;
}

/**
 * Login
 */
async function login({ identifier, password, userAgent, ip }) {
  const user =
    (await findUserByEmail(identifier, { includeSensitive: true })) ||
    (await findUserByUsername(identifier, { includeSensitive: true }));

  if (!user) {
    logger.security("medium", "Intento de login fallido - usuario no existe", { identifier, ip });
    throw new Error("Credenciales inválidas");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.security("medium", "Intento de login fallido - password incorrecto", {
      userId: user.id,
      username: user.username,
      ip,
    });
    throw new Error("Credenciales inválidas");
  }

  if (!user.isActive) {
    logger.security("medium", "Intento de login en cuenta desactivada", {
      userId: user.id,
      username: user.username,
      ip,
    });
    throw new Error("La cuenta está desactivada");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id, userAgent, ip);

  await updateLastLogin(user.id);

  logger.auth(user.id, "login_successful", {
    username: user.username,
    ip,
    userAgent,
  });

  return { user, accessToken, refreshToken };
}

/**
 * Refrescar access token
 */
async function refreshAccessToken(refreshToken) {
  const q = `
    SELECT *
    FROM refresh_tokens
    WHERE token = $1
      AND is_revoked = FALSE
      AND expires_at > NOW()
    LIMIT 1;
  `;

  const { rows } = await db.query(q, [refreshToken]);
  const row = rows[0];

  if (!row) throw new Error("Refresh token inválido o expirado");

  const user = await findUserById(row.user_id);

  if (!user || !user.isActive) {
    throw new Error("Usuario no válido");
  }

  return generateAccessToken(user);
}

/**
 * Logout (revoca solo este token)
 */
async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
  logger.info("User logged out (single session)");
}

/**
 * Logout global
 */
async function logoutAll(userId) {
  await revokeAllRefreshTokens(userId);
  logger.auth(userId, "logout_all_sessions", {
    message: "Usuario cerró sesión en todos los dispositivos",
  });
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
};
