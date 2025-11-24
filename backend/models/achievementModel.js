// models/achievementModel.js
const db = require("../db");

function mapAchievement(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
    createdAt: row.created_at,
  };
}

function mapUserAchievement(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
    progress: row.progress,
    completed: row.completed,
  };
}

/* ======================================================
   LOGROS
====================================================== */

async function createAchievement({ code, name, description, iconUrl }) {
  const query = `
    INSERT INTO achievements (code, name, description, icon_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await db.query(query, [
    code,
    name,
    description,
    iconUrl,
  ]);

  return mapAchievement(rows[0]);
}

async function getAchievementByCode(code) {
  const { rows } = await db.query(
    "SELECT * FROM achievements WHERE code = $1",
    [code]
  );
  return mapAchievement(rows[0]);
}

async function listAchievements() {
  const { rows } = await db.query("SELECT * FROM achievements ORDER BY id ASC");
  return rows.map(mapAchievement);
}

/* ======================================================
   LOGROS DEL USUARIO
====================================================== */

async function unlockAchievement({ userId, achievementId }) {
  const query = `
    INSERT INTO user_achievements (
      user_id, achievement_id, completed, progress
    )
    VALUES ($1, $2, TRUE, 1)
    ON CONFLICT (user_id, achievement_id)
    DO UPDATE SET
      completed = TRUE,
      progress = 1,
      unlocked_at = NOW()
    RETURNING *;
  `;

  const { rows } = await db.query(query, [userId, achievementId]);
  return mapUserAchievement(rows[0]);
}

/**
 * Incrementa progreso: útil para logros acumulativos (10 batallas, 100 votos, etc.)
 */
async function incrementProgress({ userId, achievementId, amount = 1 }) {
  const query = `
    UPDATE user_achievements
    SET progress = progress + $3,
        completed = CASE WHEN progress + $3 >= 1 THEN TRUE ELSE completed END
    WHERE user_id = $1
      AND achievement_id = $2
    RETURNING *;
  `;

  const { rows } = await db.query(query, [userId, achievementId, amount]);
  return rows.length > 0 ? mapUserAchievement(rows[0]) : null;
}

async function getUserAchievements(userId) {
  const query = `
    SELECT ua.*, a.code, a.name, a.description, a.icon_url
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = $1;
  `;

  const { rows } = await db.query(query, [userId]);

  return rows.map((row) => ({
    ...mapUserAchievement(row),
    code: row.code,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
  }));
}

module.exports = {
  createAchievement,
  getAchievementByCode,
  listAchievements,

  unlockAchievement,
  incrementProgress,
  getUserAchievements,
};
