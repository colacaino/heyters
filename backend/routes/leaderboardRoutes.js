// routes/leaderboardRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper para respuestas consistentes
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/**
 * GET /api/leaderboard
 * Obtiene el ranking de usuarios basado en victorias y batallas
 * Query params:
 *   - timeframe: 'all' | 'month' | 'week' (default: 'all')
 *   - limit: number (default: 50)
 */
router.get("/", async (req, res) => {
  try {
    const { timeframe = "all", limit = 50 } = req.query;

    // Por ahora solo soportamos "all" - en el futuro se puede filtrar por fecha
    // usando battle_participants.joined_at para filtrar por periodo

    const query = `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.total_wins,
        u.total_battles,
        CASE
          WHEN u.total_battles > 0 THEN u.total_battles - u.total_wins
          ELSE 0
        END as losses,
        CASE
          WHEN u.total_battles > 0
          THEN ROUND((u.total_wins::numeric / u.total_battles) * 100, 1)
          ELSE 0
        END as win_rate,
        (u.total_wins * 50 + u.total_battles * 10) as points
      FROM users u
      WHERE u.total_battles > 0
        AND u.is_active = true
      ORDER BY points DESC, u.total_wins DESC, u.total_battles DESC
      LIMIT $1
    `;

    const result = await db.query(query, [parseInt(limit)]);

    // Agregar ranking
    const leaderboard = result.rows.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      wins: user.total_wins,
      losses: user.losses,
      totalBattles: user.total_battles,
      winRate: parseFloat(user.win_rate),
      points: user.points,
    }));

    return send(res, 200, true, "Leaderboard obtenido", {
      leaderboard,
      timeframe,
      total: leaderboard.length
    });
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    return send(res, 500, false, "Error al obtener el leaderboard");
  }
});

/**
 * GET /api/leaderboard/user/:userId
 * Obtiene la posicion de un usuario especifico en el ranking
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Obtener datos del usuario
    const userQuery = `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.total_wins,
        u.total_battles,
        CASE
          WHEN u.total_battles > 0 THEN u.total_battles - u.total_wins
          ELSE 0
        END as losses,
        CASE
          WHEN u.total_battles > 0
          THEN ROUND((u.total_wins::numeric / u.total_battles) * 100, 1)
          ELSE 0
        END as win_rate,
        (u.total_wins * 50 + u.total_battles * 10) as points
      FROM users u
      WHERE u.id = $1
    `;

    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    const userData = userResult.rows[0];

    // Calcular ranking (posicion entre todos los usuarios)
    const rankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE is_active = true
        AND total_battles > 0
        AND (total_wins * 50 + total_battles * 10) > $1
    `;

    const rankResult = await db.query(rankQuery, [userData.points]);
    const rank = parseInt(rankResult.rows[0].rank);

    return send(res, 200, true, "Ranking del usuario obtenido", {
      rank,
      id: userData.id,
      username: userData.username,
      displayName: userData.display_name,
      avatarUrl: userData.avatar_url,
      wins: userData.total_wins,
      losses: userData.losses,
      totalBattles: userData.total_battles,
      winRate: parseFloat(userData.win_rate),
      points: userData.points,
    });
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    return send(res, 500, false, "Error al obtener ranking del usuario");
  }
});

module.exports = router;
