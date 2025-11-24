// models/commentModel.js
const db = require("../db");

/**
 * Mapea fila a objeto JS
 */
function mapComment(row) {
  if (!row) return null;

  return {
    id: row.id,
    battleId: row.battle_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    content: row.content,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    username: row.username || null,
    displayName: row.display_name || null,
    avatarUrl: row.avatar_url || null,
  };
}

/* ========================================================
   COMENTARIOS
======================================================== */

/**
 * Crear comentario
 */
async function createComment({ battleId, userId, content, parentCommentId = null }) {
  const queryText = `
    INSERT INTO comments (
      battle_id, user_id, parent_comment_id, content
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await db.query(queryText, [
    battleId,
    userId,
    parentCommentId,
    content,
  ]);

  return mapComment(rows[0]);
}

/**
 * Obtener comentario por ID
 */
async function getCommentById(commentId) {
  const query = `
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = $1;
  `;
  const { rows } = await db.query(query, [commentId]);
  return mapComment(rows[0]);
}

/**
 * Editar comentario
 */
async function updateComment(commentId, content) {
  const { rows } = await db.query(
    `
    UPDATE comments
    SET content = $2
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *;
  `,
    [commentId, content]
  );
  return mapComment(rows[0]);
}

/**
 * Soft delete de comentario
 */
async function deleteComment(commentId) {
  const { rows } = await db.query(
    `
    UPDATE comments
    SET is_deleted = TRUE,
        content = '[Comentario eliminado por el usuario]'
    WHERE id = $1
    RETURNING *;
  `,
    [commentId]
  );
  return mapComment(rows[0]);
}

/**
 * Listar comentarios de una batalla
 */
async function listComments(battleId, { page = 1, limit = 30 } = {}) {
  const offset = (page - 1) * limit;

  const query = `
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.battle_id = $1
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3;
  `;

  const { rows } = await db.query(query, [battleId, limit, offset]);
  return rows.map(mapComment);
}

/* ========================================================
   REACCIONES
======================================================== */

async function addReaction({ commentId, userId, reactionType }) {
  const query = `
    INSERT INTO comment_reactions (
      comment_id, user_id, reaction_type
    )
    VALUES ($1, $2, $3)
    ON CONFLICT (comment_id, user_id, reaction_type)
    DO NOTHING
    RETURNING *;
  `;
  const { rows } = await db.query(query, [commentId, userId, reactionType]);
  return rows[0] || null;
}

async function removeReaction({ commentId, userId, reactionType }) {
  const query = `
    DELETE FROM comment_reactions
    WHERE comment_id = $1
      AND user_id = $2
      AND reaction_type = $3
    RETURNING *;
  `;
  const { rows } = await db.query(query, [commentId, userId, reactionType]);
  return rows[0] || null;
}

async function listReactions(commentId) {
  const query = `
    SELECT reaction_type, COUNT(*) AS total
    FROM comment_reactions
    WHERE comment_id = $1
    GROUP BY reaction_type;
  `;
  const { rows } = await db.query(query, [commentId]);
  return rows;
}

module.exports = {
  createComment,
  getCommentById,
  updateComment,
  deleteComment,
  listComments,

  // Reacciones
  addReaction,
  removeReaction,
  listReactions,
};
