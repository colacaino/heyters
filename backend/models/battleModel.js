// models/battleModel.js
const db = require("../db");

/**
 * Mapea fila de battles a objeto JS
 */
function mapBattleRow(row, { includeSensitive = false } = {}) {
  if (!row) return null;

  const battle = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    visibility: row.visibility,
    mode: row.mode,
    language: row.language,
    maxRounds: row.max_rounds,
    roundDurationSeconds: row.round_duration_seconds,
    battleState: row.battle_state,
    roundState: row.round_state,
    currentRound: row.current_round,
    currentTurn: row.current_turn,
    roundTimeRemaining: row.round_time_remaining,
    roundStartedAt: row.round_started_at,
    activeRoundId: row.active_round_id,
    createdBy: row.created_by,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeSensitive) {
    battle.passwordHash = row.password_hash;
  }

  return battle;
}

/**
 * Crea una batalla
 */
async function createBattle({
  title,
  description = null,
  status = "scheduled",
  visibility = "public",
  passwordHash = null,
  mode = "1v1",
  language = "es",
  maxRounds = 3,
  roundDurationSeconds = 90,
  createdBy,
  scheduledAt = null,
}) {
  const queryText = `
    INSERT INTO battles (
      title,
      description,
      status,
      visibility,
      password_hash,
      mode,
      language,
      max_rounds,
      round_duration_seconds,
      created_by,
      scheduled_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  const values = [
    title,
    description,
    status,
    visibility,
    passwordHash,
    mode,
    language,
    maxRounds,
    roundDurationSeconds,
    createdBy,
    scheduledAt,
  ];

  const { rows } = await db.query(queryText, values);
  return mapBattleRow(rows[0]);
}

/**
 * Actualiza datos básicos de una batalla
 */
async function updateBattle(battleId, data = {}) {
  const allowedFields = {
    title: "title",
    description: "description",
    status: "status",
    visibility: "visibility",
    passwordHash: "password_hash",
    mode: "mode",
    language: "language",
    maxRounds: "max_rounds",
    roundDurationSeconds: "round_duration_seconds",
    battleState: "battle_state",
    roundState: "round_state",
    currentRound: "current_round",
    currentTurn: "current_turn",
    roundTimeRemaining: "round_time_remaining",
    roundStartedAt: "round_started_at",
    activeRoundId: "active_round_id",
    scheduledAt: "scheduled_at",
    startedAt: "started_at",
    endedAt: "ended_at",
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
    return getBattleById(battleId);
  }

  const queryText = `
    UPDATE battles
    SET ${setClauses.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  values.push(battleId);

  const { rows } = await db.query(queryText, values);
  return mapBattleRow(rows[0]);
}

/**
 * Obtiene una batalla por ID
 */
async function getBattleById(battleId, options) {
  const { rows } = await db.query("SELECT * FROM battles WHERE id = $1", [
    battleId,
  ]);
  return mapBattleRow(rows[0], options);
}

/**
 * Lista batallas con filtros típicos + paginación
 */
async function listBattles({
  page = 1,
  limit = 20,
  status = null,
  visibility = "public",
  createdBy = null,
  search = null,
  upcomingOnly = false,
  liveOnly = false,
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let index = 1;

  if (status) {
    conditions.push(`status = $${index}`);
    values.push(status);
    index += 1;
  }

  if (visibility) {
    conditions.push(`visibility = $${index}`);
    values.push(visibility);
    index += 1;
  }

  if (createdBy) {
    conditions.push(`created_by = $${index}`);
    values.push(createdBy);
    index += 1;
  }

  if (search) {
    conditions.push(`(title ILIKE $${index} OR description ILIKE $${index})`);
    values.push(`%${search}%`);
    index += 1;
  }

  if (upcomingOnly) {
    conditions.push(`status = 'scheduled' AND scheduled_at > NOW()`);
  }

  if (liveOnly) {
    conditions.push(`status = 'live'`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const queryText = `
    SELECT *
    FROM battles
    ${whereClause}
    ORDER BY
      CASE
        WHEN status = 'live' THEN 0
        WHEN status = 'scheduled' THEN 1
        ELSE 2
      END,
      COALESCE(scheduled_at, created_at) ASC
    LIMIT $${index} OFFSET $${index + 1};
  `;
  values.push(limit, offset);

  const { rows } = await db.query(queryText, values);

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM battles
    ${whereClause};
  `;
  const { rows: countRows } = await db.query(
    countQuery,
    values.slice(0, index - 1)
  );
  const total = parseInt(countRows[0].total, 10);

  return {
    data: rows.map(mapBattleRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Añade un participante a una batalla
 */
async function addParticipant({
  battleId,
  userId,
  role = "mc",
  slotNumber = null,
}) {
  const queryText = `
    INSERT INTO battle_participants (
      battle_id,
      user_id,
      role,
      slot_number
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (battle_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      slot_number = EXCLUDED.slot_number,
      joined_at = NOW()
    RETURNING *;
  `;

  const values = [battleId, userId, role, slotNumber];
  const { rows } = await db.query(queryText, values);
  return rows[0];
}

/**
 * Marca a un participante como ganador + asigna score
 */
async function markWinner({ battleId, userId, score = null }) {
  const queryText = `
    UPDATE battle_participants
    SET is_winner = TRUE,
        score = COALESCE($3, score)
    WHERE battle_id = $1
      AND user_id = $2
    RETURNING *;
  `;
  const values = [battleId, userId, score];
  const { rows } = await db.query(queryText, values);
  return rows[0];
}

/**
 * Lista participantes de una batalla
 */
async function listParticipants(battleId) {
  const { rows } = await db.query(
    `
    SELECT bp.*, u.username, u.display_name
    FROM battle_participants bp
    JOIN users u ON u.id = bp.user_id
    WHERE bp.battle_id = $1
    ORDER BY bp.slot_number ASC NULLS LAST, bp.joined_at ASC;
  `,
    [battleId]
  );

  return rows;
}

/**
 * Obtiene un participante específico por batalla y usuario
 */
async function getParticipant({ battleId, userId }) {
  const { rows } = await db.query(
    `
    SELECT *
    FROM battle_participants
    WHERE battle_id = $1
      AND user_id = $2
    LIMIT 1;
  `,
    [battleId, userId]
  );

  return rows[0];
}

/**
 * Añade un round a la batalla
 */
async function addRound({
  battleId,
  roundNumber,
  theme = null,
  beatUrl = null,
}) {
  const queryText = `
    INSERT INTO battle_rounds (
      battle_id,
      round_number,
      theme,
      beat_url
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (battle_id, round_number)
    DO UPDATE SET
      theme = EXCLUDED.theme,
      beat_url = EXCLUDED.beat_url
    RETURNING *;
  `;
  const values = [battleId, roundNumber, theme, beatUrl];
  const { rows } = await db.query(queryText, values);
  return rows[0];
}

/**
 * Lista rounds de una batalla
 */
async function listRounds(battleId) {
  const { rows } = await db.query(
    `
    SELECT *
    FROM battle_rounds
    WHERE battle_id = $1
    ORDER BY round_number ASC;
  `,
    [battleId]
  );
  return rows;
}

/**
 * Registra un voto para un MC en una batalla/round
 */
async function addVote({
  battleId,
  roundId = null,
  voterId = null,
  targetUserId,
  scoreStyle = "total",
  score = 0,
  metadata = null,
}) {
  const queryText = `
    INSERT INTO battle_votes (
      battle_id,
      round_id,
      voter_id,
      target_user_id,
      score_style,
      score,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    battleId,
    roundId,
    voterId,
    targetUserId,
    scoreStyle,
    score,
    metadata,
  ];

  const { rows } = await db.query(queryText, values);
  return rows[0];
}

/**
 * Obtiene una batalla con participantes y rounds
 */
async function getBattleWithDetails(battleId) {
  const battle = await getBattleById(battleId);
  if (!battle) return null;

  const [participantsRes, roundsRes] = await Promise.all([
    db.query(
      `
      SELECT bp.*, u.username, u.display_name
      FROM battle_participants bp
      JOIN users u ON u.id = bp.user_id
      WHERE bp.battle_id = $1
      ORDER BY bp.slot_number ASC NULLS LAST, bp.joined_at ASC;
    `,
      [battleId]
    ),
    db.query(
      `
      SELECT *
      FROM battle_rounds
      WHERE battle_id = $1
      ORDER BY round_number ASC;
    `,
      [battleId]
    ),
  ]);

  return {
    ...battle,
    participants: participantsRes.rows,
    rounds: roundsRes.rows,
  };
}

module.exports = {
  createBattle,
  updateBattle,
  getBattleById,
  listBattles,
  addParticipant,
  markWinner,
  listParticipants,
  getParticipant,
  addRound,
  listRounds,
  addVote,
  getBattleWithDetails,
};
