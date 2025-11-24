// models/userModel.js
const db = require("../db");

/**
 * Convierte una fila de la tabla users a objeto JS en camelCase
 */
function mapUserRow(row, { includeSensitive = false } = {}) {
  if (!row) return null;

  const isAdmin = row.role === "admin";
  const canRap = row.can_rap || isAdmin || row.is_demo_user;
  const canModerate = row.can_moderate || isAdmin || row.is_demo_user;
  const isPro = canRap || canModerate;

  const user = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    country: row.country,
    city: row.city,
    role: row.role,
    isPro,
    isAdmin,
    proExpiresAt: row.pro_expires_at,
    totalBattles: row.total_battles || 0,
    totalWins: row.total_wins || 0,
    canRap,
    canModerate,
    isDemoUser: row.is_demo_user,
    isVerified: row.is_verified,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeSensitive) {
    user.passwordHash = row.password_hash;
  }

  return user;
}

/**
 * Crea un usuario nuevo
 */
async function createUser({
  username,
  displayName,
  email,
  passwordHash,
  bio = null,
  avatarUrl = null,
  country = null,
  city = null,
  role = "basic", // Cambiado: ahora default es 'basic'
  isPro = false,
}) {
  const grantRap = Boolean(isPro || role === "pro" || role === "moderator" || role === "admin");
  const grantModerate = Boolean(isPro || role === "moderator" || role === "admin");

  const queryText = `
    INSERT INTO users (
      username,
      display_name,
      email,
      password_hash,
      bio,
      avatar_url,
      country,
      city,
      role,
      is_pro,
      can_rap,
      can_moderate
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `;

  const values = [
    username,
    displayName,
    email,
    passwordHash,
    bio,
    avatarUrl,
    country,
    city,
    role,
    isPro,
    grantRap,
    grantModerate,
  ];

  const { rows } = await db.query(queryText, values);
  return mapUserRow(rows[0]);
}

/**
 * Actualiza el estado Pro de un usuario
 */
async function updateUserProStatus(userId, isPro, expiresAt = null) {
  const canRap = Boolean(isPro);
  const canModerate = Boolean(isPro);

  const { rows } = await db.query(
    `UPDATE users
     SET is_pro = $2,
         pro_expires_at = $3,
         role = CASE WHEN $2 = TRUE THEN 'pro' ELSE 'basic' END,
         can_rap = $4,
         can_moderate = $5
     WHERE id = $1
     RETURNING *`,
    [userId, isPro, expiresAt, canRap, canModerate]
  );
  return mapUserRow(rows[0]);
}

/**
 * Incrementa estadísticas de batalla del usuario
 */
async function incrementUserBattleStats(userId, won = false) {
  const { rows } = await db.query(
    `UPDATE users
     SET total_battles = total_battles + 1,
         total_wins = total_wins + CASE WHEN $2 = TRUE THEN 1 ELSE 0 END
     WHERE id = $1
     RETURNING *`,
    [userId, won]
  );
  return mapUserRow(rows[0]);
}

// Mantener compatibilidad con código antiguo
async function createUserLegacy({
  username,
  displayName,
  email,
  passwordHash,
  bio = null,
  avatarUrl = null,
  country = null,
  city = null,
  role = "basic",
  canRap = false,
  canModerate = false,
  isDemoUser = false,
}) {
  // Determinar si es pro basado en los flags legacy
  const isPro = canRap || canModerate;
  const finalRole = isPro ? 'pro' : role === 'user' ? 'basic' : role;

  return createUser({
    username,
    displayName,
    email,
    passwordHash,
    bio,
    avatarUrl,
    country,
    city,
    role: finalRole,
    isPro,
  });
}

/**
 * Busca usuario por ID
 */
async function findUserById(id, options) {
  const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  return mapUserRow(rows[0], options);
}

/**
 * Busca usuario por email
 */
async function findUserByEmail(email, options) {
  const { rows } = await db.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return mapUserRow(rows[0], options);
}

/**
 * Busca usuario por username
 */
async function findUserByUsername(username, options) {
  const { rows } = await db.query(
    "SELECT * FROM users WHERE username = $1 LIMIT 1",
    [username]
  );
  return mapUserRow(rows[0], options);
}

/**
 * Actualiza la fecha del último login
 */
async function updateLastLogin(userId) {
  const { rows } = await db.query(
    `
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
    [userId]
  );

  return mapUserRow(rows[0]);
}

/**
 * Desactiva un usuario (soft-delete)
 */
async function deactivateUser(userId) {
  const { rows } = await db.query(
    `
    UPDATE users
    SET is_active = FALSE
    WHERE id = $1
    RETURNING *;
  `,
    [userId]
  );

  return mapUserRow(rows[0]);
}

async function deleteUser(userId) {
  await db.query("DELETE FROM users WHERE id = $1", [userId]);
  return true;
}

/**
 * Actualiza campos editables de un usuario
 * data puede incluir: displayName, bio, avatarUrl, country, city, role, isVerified, isActive
 */
async function updateUser(userId, data = {}) {
  // SEGURIDAD: role, isVerified, isActive solo pueden ser modificados por admins
  // a través de funciones específicas, NO por updateUser genérico
  const allowedFields = {
    displayName: "display_name",
    bio: "bio",
    avatarUrl: "avatar_url",
    country: "country",
    city: "city",
  };

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, column] of Object.entries(allowedFields)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      setClauses.push(`${column} = $${index}`);
      values.push(data[key]);
      index += 1;
    }
  }

  if (setClauses.length === 0) {
    // Nada que actualizar
    return findUserById(userId);
  }

  // Para updated_at, ya tenemos trigger, pero igual sirve forzar NOW() si quieres
  const queryText = `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;

  values.push(userId);

  const { rows } = await db.query(queryText, values);
  return mapUserRow(rows[0]);
}

/**
 * Lista usuarios con filtros + paginación básica
 */
async function listUsers({
  page = 1,
  limit = 20,
  search = null,
  role = null,
  isActive = null,
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let index = 1;

  if (search) {
    conditions.push(
      `(username ILIKE $${index} OR display_name ILIKE $${index} OR email ILIKE $${index})`
    );
    values.push(`%${search}%`);
    index += 1;
  }

  if (role) {
    conditions.push(`role = $${index}`);
    values.push(role);
    index += 1;
  }

  if (typeof isActive === "boolean") {
    conditions.push(`is_active = $${index}`);
    values.push(isActive);
    index += 1;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const queryText = `
    SELECT *
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${index} OFFSET $${index + 1};
  `;

  values.push(limit, offset);

  const { rows } = await db.query(queryText, values);

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM users
    ${whereClause};
  `;
  const { rows: countRows } = await db.query(countQuery, values.slice(0, index - 1));
  const total = parseInt(countRows[0].total, 10);

  return {
    data: rows.map(mapUserRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  updateLastLogin,
  deactivateUser,
  deleteUser,
  updateUser,
  listUsers,
  updateUserProStatus,
  incrementUserBattleStats,
};
