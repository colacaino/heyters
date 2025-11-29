// services/battleService.js
const {
  createBattle,
  updateBattle,
  getBattleById,
  listBattles,
  addParticipant,
  markWinner,
  listParticipants,
  addRound,
  addVote,
  getBattleWithDetails,
  getParticipant,
} = require("../models/battleModel");
const { findUserById } = require("../models/userModel");
const db = require("../db");
const { AccessToken } = require("livekit-server-sdk");
const battleRealtime = require("./battleRealtimeService");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const CONTROL_ROLES = ["moderator"];
const TURN_SEQUENCE = ["mc1", "mc2"];
const MEDIA_BASE_URL =
  process.env.MEDIA_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
const LOCAL_BEATS_DIR = path.join(__dirname, "..", "public", "beats");

async function ensureBattle(battleId, options) {
  const battle = await getBattleById(battleId, options);
  if (!battle) throw new Error("La batalla no existe");
  return battle;
}

async function ensureRapAccess(userId) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Usuario no encontrado");
  if (!user.canRap && !user.isDemoUser) {
    throw new Error("Necesitas un plan que permita rapear");
  }
  return user;
}

async function ensureModerateAccess(userId) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Usuario no encontrado");
  if (!user.canModerate && !user.isDemoUser) {
    throw new Error("Necesitas un plan que permita moderar");
  }
  return user;
}

async function ensureController(battleId, userId) {
  const participant = await getParticipant({ battleId, userId });
  if (!participant || !CONTROL_ROLES.includes(participant.role)) {
    throw new Error("No tienes permisos para controlar esta batalla");
  }
  return participant;
}

function broadcastState(battleId, state, eventName = null) {
  if (eventName) {
    battleRealtime.emitBattleEvent(battleId, eventName, { battleId, state });
  }
  battleRealtime.emitBattleState(battleId, state);
}

function resolveNextTurn(currentTurn = "mc1") {
  if (currentTurn === TURN_SEQUENCE[0]) return TURN_SEQUENCE[1];
  return TURN_SEQUENCE[0];
}

async function createBattleService(data) {
  await ensureRapAccess(data.createdBy);
  const battle = await createBattle(data);

  for (let i = 1; i <= battle.maxRounds; i += 1) {
    await addRound({
      battleId: battle.id,
      roundNumber: i,
      theme: null,
      beatUrl: null,
    });
  }

  return battle;
}

async function listBattlesService(filters = {}) {
  return await listBattles(filters);
}

async function addParticipantService(battleId, userId, role, slotNumber) {
  const battle = await ensureBattle(battleId);
  const normalizedRole = role?.toLowerCase() || "viewer";
  if (normalizedRole !== "viewer" && battle.status !== "scheduled") {
    throw new Error("Solo puedes asignar MCs o moderador antes de iniciar la batalla");
  }

  if (["mc1", "mc2", "moderator"].includes(normalizedRole)) {
    const existing = await db.query(
      `
      SELECT user_id
      FROM battle_participants
      WHERE battle_id = $1
        AND role = $2
      LIMIT 1;
    `,
      [battleId, normalizedRole]
    );
    if (
      existing.rows.length > 0 &&
      Number(existing.rows[0].user_id) !== Number(userId)
    ) {
      throw new Error(`El rol ${normalizedRole.toUpperCase()} ya fue asignado`);
    }
  }

  if (normalizedRole === "mc1" || normalizedRole === "mc2") {
    await ensureRapAccess(userId);
  }
  if (normalizedRole === "moderator") {
    await ensureModerateAccess(userId);
  }

  const participant = await addParticipant({ battleId, userId, role: normalizedRole, slotNumber });

  try {
    const detailed = await getBattleWithDetails(battleId);
    if (detailed) {
      broadcastState(battleId, detailed, "battle:participants_updated");
    }
  } catch (err) {
    console.error("[Battle] No se pudo transmitir participantes actualizados:", err);
  }

  return participant;
}

async function startBattle(battleId, userId) {
  await ensureController(battleId, userId);
  const battle = await ensureBattle(battleId);

  if (battle.battleState === "finished") {
    throw new Error("La batalla ya finalizó");
  }

  if (battle.battleState === "running") {
    broadcastState(battleId, battle);
    return battle;
  }

  const updated = await updateBattle(battleId, {
    status: "live",
    startedAt: battle.startedAt || new Date(),
    battleState: "running",
    roundState: battle.roundState || "pending",
    currentRound: battle.currentRound || 1,
    currentTurn: battle.currentTurn || "mc1",
    roundTimeRemaining: battle.roundTimeRemaining || battle.roundDurationSeconds,
  });

  broadcastState(battleId, updated, "battle:start");
  return updated;
}

async function startRound(battleId, userId, { roundNumber = null, duration = null } = {}) {
  await ensureController(battleId, userId);
  const battle = await ensureBattle(battleId);

  if (battle.battleState !== "running") {
    throw new Error("Primero debes iniciar la batalla");
  }

  if (battle.roundState === "running") {
    throw new Error("Ya existe un round en curso");
  }

  const nextRound = roundNumber || battle.currentRound || 1;
  const activeRound = await addRound({
    battleId,
    roundNumber: nextRound,
  });

  const totalDuration = Number(duration || battle.roundDurationSeconds || 90);
  battleRealtime.stopRoundTimer(battleId);

  const updated = await updateBattle(battleId, {
    currentRound: nextRound,
    activeRoundId: activeRound.id,
    roundState: "running",
    battleState: "running",
    currentTurn: "mc1",
    roundTimeRemaining: totalDuration,
    roundStartedAt: new Date(),
  });

  scheduleRoundTimer(battleId, totalDuration);
  broadcastState(battleId, updated, "battle:start_round");
  if (activeRound.beat_url) {
    battleRealtime.emitBattleEvent(battleId, "battle:beat_selected", {
      battleId,
      roundNumber: nextRound,
      beatUrl: activeRound.beat_url,
    });
  }
  return updated;
}

async function nextTurn(battleId, userId) {
  await ensureController(battleId, userId);
  const battle = await ensureBattle(battleId);

  if (battle.roundState !== "running") {
    throw new Error("No hay un round activo");
  }

  const next = resolveNextTurn(battle.currentTurn);
  const updated = await updateBattle(battleId, {
    currentTurn: next,
  });

  broadcastState(battleId, updated, "battle:next_turn");
  return updated;
}

async function endRoundInternal(battleId, userId, { auto = false } = {}) {
  if (!auto) {
    await ensureController(battleId, userId);
  }

  const battle = await ensureBattle(battleId);
  if (battle.roundState === "finished") {
    return battle;
  }

  battleRealtime.stopRoundTimer(battleId);

  const nextRound =
    battle.currentRound >= battle.maxRounds
      ? battle.currentRound
      : battle.currentRound + 1;

  const updated = await updateBattle(battleId, {
    roundState: "finished",
    currentTurn: null,
    roundTimeRemaining: 0,
    currentRound: nextRound,
  });

  broadcastState(battleId, updated, "battle:end_round");
  return updated;
}

async function endRound(battleId, userId) {
  return await endRoundInternal(battleId, userId);
}

async function finishBattle(battleId, userId) {
  await ensureController(battleId, userId);
  await ensureBattle(battleId);

  battleRealtime.stopRoundTimer(battleId);

  const updated = await updateBattle(battleId, {
    status: "finished",
    battleState: "finished",
    roundState: "finished",
    currentTurn: null,
    roundTimeRemaining: 0,
    endedAt: new Date(),
  });

  broadcastState(battleId, updated, "battle:finish");
  return updated;
}

async function voteBattle({ battleId, voterId, targetUserId }) {
  const battle = await ensureBattle(battleId);

  if (battle.roundState !== "running") {
    throw new Error("Solo se puede votar durante un round activo");
  }

  if (!battle.activeRoundId) {
    throw new Error("No hay round activo para registrar votos");
  }

  const activeRoundId = battle.activeRoundId;

  const existing = await db.query(
    `
    SELECT id FROM battle_votes
    WHERE battle_id = $1 AND round_id = $2 AND voter_id = $3
    LIMIT 1;
  `,
    [battleId, activeRoundId, voterId]
  );

  if (existing.rows.length > 0) {
    throw new Error("Ya emitiste un voto en este round");
  }

  const vote = await addVote({
    battleId,
    roundId: activeRoundId,
    voterId,
    targetUserId,
    scoreStyle: "audience",
    score: 1,
    metadata: { source: "live_vote" },
  });

  const tallyRes = await db.query(
    `
    SELECT target_user_id, COUNT(*) AS total
    FROM battle_votes
    WHERE battle_id = $1 AND round_id = $2
    GROUP BY target_user_id;
  `,
    [battleId, activeRoundId]
  );

  const votes = tallyRes.rows.map((row) => ({
    targetUserId: Number(row.target_user_id),
    total: Number(row.total),
  }));

  battleRealtime.emitBattleEvent(battleId, "battle:vote_cast", {
    battleId,
    roundId: activeRoundId,
    votes,
  });

  return { vote, votes };
}

async function calculateWinner(battleId) {
  const participants = await listParticipants(battleId);
  const scores = {};

  for (const p of participants) {
    scores[p.user_id] = 0;
  }

  const { rows: votes } = await db.query(
    `
    SELECT target_user_id, SUM(score) AS total
    FROM battle_votes
    WHERE battle_id = $1
    GROUP BY target_user_id;
  `,
    [battleId]
  );

  for (const v of votes) {
    scores[v.target_user_id] += Number(v.total);
  }

  const winnerId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (winnerId) {
    await markWinner({ battleId, userId: winnerId });
  }

  return { winnerId, scores };
}

async function getBattleDetails(battleId) {
  const battle = await getBattleWithDetails(battleId);
  if (!battle) throw new Error("La batalla no existe");

  const scoreRes = await db.query(
    `
    SELECT target_user_id, SUM(score) AS total
    FROM battle_votes
    WHERE battle_id = $1
    GROUP BY target_user_id
    ORDER BY total DESC;
  `,
    [battleId]
  );

  return {
    ...battle,
    scoreboard: scoreRes.rows,
  };
}

async function getBattleState(battleId) {
  try {
    return await ensureBattle(battleId);
  } catch (error) {
    if (error.message === "La batalla no existe") {
      return null;
    }
    throw error;
  }
}

async function joinPrivateBattle(battleId, userId, { role = "viewer", slotNumber = null, password }) {
  const battle = await ensureBattle(battleId, { includeSensitive: true });

  if (battle.visibility !== "private" || !battle.passwordHash) {
    throw new Error("Esta batalla no requiere contraseña");
  }

  const valid = await bcrypt.compare(password || "", battle.passwordHash);
  if (!valid) {
    throw new Error("Contraseña incorrecta");
  }

  const participant = await addParticipantService(battleId, userId, role, slotNumber);
  return { participant };
}

async function selectBeat(battleId, userId, { beatUrl, roundNumber = null }) {
  if (!beatUrl) throw new Error("Debes seleccionar un beat");

  await ensureController(battleId, userId);
  const battle = await ensureBattle(battleId);

  const targetRound = roundNumber || battle.currentRound || 1;

  const round = await addRound({
    battleId,
    roundNumber: targetRound,
    beatUrl,
  });

  battleRealtime.emitBattleEvent(battleId, "battle:beat_selected", {
    battleId,
    roundNumber: targetRound,
    beatUrl,
  });

  return { round };
}

function scheduleRoundTimer(battleId, duration) {
  battleRealtime.startRoundTimer({
    battleId,
    duration,
    onTick: async (remaining) => {
      const updated = await updateBattle(battleId, {
        roundTimeRemaining: remaining,
      });
      broadcastState(battleId, updated);
    },
    onTimeout: async () => {
      await endRoundInternal(battleId, null, { auto: true });
    },
  });
}

async function getBattleJoinToken(battleId, authPayload) {
  const battle = await ensureBattle(battleId);
  if (!battle) throw new Error("La batalla no existe");

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("LiveKit no está configurado. Define LIVEKIT_URL, LIVEKIT_API_KEY y LIVEKIT_API_SECRET");
  }

  const dbUser = await findUserById(authPayload.userId);
  const identity = `user_${authPayload.userId}`;
  const name =
    dbUser?.displayName || dbUser?.username || authPayload.username || `User ${authPayload.userId}`;

  let canPublish = false;
  const participant = await getParticipant({ battleId, userId: authPayload.userId });
  if (participant) {
    const role = participant.role?.toLowerCase();
    canPublish = role === "mc1" || role === "mc2" || role === "moderator";
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
  });
  at.addGrant({
    roomJoin: true,
    room: `battle_${battleId}`,
    canPublish,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return {
    url,
    token,
    canPublish,
    roomName: `battle_${battleId}`,
  };
}

async function ensureBeatsDirectory() {
  await fs.promises.mkdir(LOCAL_BEATS_DIR, { recursive: true });
  return LOCAL_BEATS_DIR;
}

async function listLocalBeats() {
  const directory = await ensureBeatsDirectory();
  const entries = await fs.promises.readdir(directory, { withFileTypes: true });
  const allowedExt = new Set([".mp3", ".wav", ".ogg", ".m4a"]);

  return entries
    .filter((entry) => entry.isFile() && allowedExt.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const parsed = path.parse(entry.name);
      const friendlyName = parsed.name.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
      return {
        id: parsed.name,
        name: friendlyName || parsed.name,
        url: `${MEDIA_BASE_URL}/media/beats/${encodeURIComponent(entry.name)}`,
      };
    });
}

async function controlParticipantMedia(battleId, controllerUserId, { targetUserId, device, action }) {
  if (!battleId || !controllerUserId || !targetUserId) {
    throw new Error("Par�metros incompletos para controlar dispositivos");
  }

  const normalizedDevice = device === "microphone" ? "microphone" : "camera";
  const normalizedAction = action === "disable" ? "disable" : "enable";

  const controller = await ensureController(battleId, controllerUserId);
  if (!controller) {
    throw new Error("No puedes controlar esta batalla");
  }

  const target = await getParticipant({ battleId, userId: targetUserId });
  if (!target || !["mc1", "mc2"].includes((target.role || "").toLowerCase())) {
    throw new Error("Solo puedes controlar MCs asignados");
  }

  battleRealtime.emitBattleEvent(battleId, "battle:device_command", {
    battleId,
    targetUserId,
    device: normalizedDevice,
    action: normalizedAction,
  });
}

/**
 * OBTENER BATALLA POR ID
 * Obtiene información básica de una batalla
 * @param {number} battleId - ID de la batalla
 * @returns {Promise<Object|null>} Información de la batalla
 */
async function getBattleById(battleId) {
  const result = await db.query(
    "SELECT id, title, created_by, status FROM battles WHERE id = $1",
    [battleId]
  );

  return result.rows[0] || null;
}

/**
 * ELIMINAR BATALLA
 * Elimina una batalla y todos sus datos relacionados (cascade)
 * @param {number} battleId - ID de la batalla
 * @returns {Promise<void>}
 */
async function deleteBattleService(battleId) {
  const result = await db.query(
    "DELETE FROM battles WHERE id = $1 RETURNING id",
    [battleId]
  );

  if (result.rowCount === 0) {
    throw new Error("Batalla no encontrada");
  }

  logger.info("Batalla eliminada", { battleId });
}

module.exports = {
  createBattleService,
  listBattles: listBattlesService,
  addParticipantService,
  startBattle,
  startRound,
  nextTurn,
  endRound,
  finishBattle,
  voteBattle,
  calculateWinner,
  getBattleDetails,
  selectBeat,
  joinPrivateBattle,
  getBattleJoinToken,
  getBattleState,
  listLocalBeats,
  controlParticipantMedia,
  getBattleById,
  deleteBattleService,
};
