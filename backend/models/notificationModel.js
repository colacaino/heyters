// models/notificationModel.js
const db = require("../db");

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

/**
 * Crear notificación
 */
async function createNotification({ userId, type, title, body, data = null }) {
  const query = `
    INSERT INTO notifications (
      user_id, type, title, body, data
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await db.query(query, [userId, type, title, body, data]);
  return mapNotification(rows[0]);
}

/**
 * Marcar 1 notificación como leída
 */
async function markAsRead(notificationId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await db.query(query, [notificationId]);
  return mapNotification(rows[0]);
}

/**
 * Marcar todas como leídas para un usuario
 */
async function markAllAsRead(userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE user_id = $1
      AND is_read = FALSE
    RETURNING *;
  `;

  const { rows } = await db.query(query, [userId]);
  return rows.map(mapNotification);
}

/**
 * Listar notificaciones con filtros
 */
async function listNotifications({
  userId,
  onlyUnread = false,
  limit = 50,
  page = 1,
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [`user_id = $1`];
  const values = [userId];
  let index = 2;

  if (onlyUnread) {
    conditions.push(`is_read = FALSE`);
  }

  const query = `
    SELECT *
    FROM notifications
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT $${index} OFFSET $${index + 1};
  `;

  values.push(limit, offset);

  const { rows } = await db.query(query, values);
  return rows.map(mapNotification);
}

module.exports = {
  createNotification,
  markAsRead,
  markAllAsRead,
  listNotifications,
};
