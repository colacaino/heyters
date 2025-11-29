// controllers/battleController.js
const battleService = require("../services/battleService");
const bcrypt = require("bcryptjs");

/* ===========================================================
   HELPER RESPONSE
=========================================================== */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/* ===========================================================
   CREAR BATALLA
=========================================================== */
exports.createBattle = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      title,
      description,
      visibility,
      mode,
      language,
      maxRounds,
      roundDurationSeconds,
      scheduledAt,
      password,
    } = req.body;

    let finalVisibility = visibility || "public";
    let passwordHash = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
      finalVisibility = "private";
    }

    const battle = await battleService.createBattleService({
      title,
      description,
      visibility: finalVisibility,
      mode,
      language,
      maxRounds,
      roundDurationSeconds,
      createdBy: userId,
      scheduledAt,
      passwordHash,
    });

    return send(res, 201, true, "Batalla creada", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   LISTAR BATALLAS
=========================================================== */
exports.listBattles = async (req, res) => {
  try {
    const data = await battleService.listBattles(req.query);
    return send(res, 200, true, "Batallas obtenidas", data);
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   AGREGAR PARTICIPANTE
=========================================================== */
exports.addParticipant = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { role, slotNumber } = req.body;
    const userId = req.user.userId;

    const result = await battleService.addParticipantService(
      battleId,
      userId,
      role,
      slotNumber,
    );

    return send(res, 200, true, "Participante agregado", { result });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   INICIAR BATALLA
=========================================================== */
exports.startBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    const battle = await battleService.startBattle(battleId, userId);

    return send(res, 200, true, "Batalla iniciada", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   INICIAR ROUND
=========================================================== */
exports.startRound = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;
    const { roundNumber, duration } = req.body;

    const battle = await battleService.startRound(battleId, userId, {
      roundNumber,
      duration,
    });

    return send(res, 200, true, "Round iniciado", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   SIGUIENTE TURNO
=========================================================== */
exports.nextTurn = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    const battle = await battleService.nextTurn(battleId, userId);

    return send(res, 200, true, "Turno actualizado", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   TERMINAR ROUND
=========================================================== */
exports.endRound = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    const battle = await battleService.endRound(battleId, userId);

    return send(res, 200, true, "Round finalizado", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   TERMINAR BATALLA
=========================================================== */
exports.endBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;

    const battle = await battleService.finishBattle(battleId, userId);

    return send(res, 200, true, "Batalla finalizada", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   VOTAR
=========================================================== */
exports.voteBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    const voterId = req.user.userId;
    const { targetUserId } = req.body;

    const result = await battleService.voteBattle({
      battleId,
      voterId,
      targetUserId,
    });

    return send(res, 200, true, "Voto registrado", result);
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   SELECCIONAR BEAT
=========================================================== */
exports.selectBeat = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;
    const { beatUrl, roundNumber } = req.body;

    const data = await battleService.selectBeat(battleId, userId, {
      beatUrl,
      roundNumber,
    });

    return send(res, 200, true, "Beat actualizado", data);
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   UNIÓN A BATALLA PRIVADA
=========================================================== */
exports.joinPrivate = async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.userId;
    const { role = "viewer", slotNumber = null, password } = req.body;

    const data = await battleService.joinPrivateBattle(battleId, userId, {
      role,
      slotNumber,
      password,
    });

    return send(res, 200, true, "Acceso concedido", data);
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   DETALLES COMPLETOS
=========================================================== */
exports.getBattleDetails = async (req, res) => {
  try {
    const { battleId } = req.params;

    const battle = await battleService.getBattleDetails(battleId);

    return send(res, 200, true, "Detalles obtenidos", { battle });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   TOKEN PARA LIVEKIT
=========================================================== */
exports.getJoinToken = async (req, res) => {
  try {
    const { battleId } = req.params;
    const user = req.user;
    const data = await battleService.getBattleJoinToken(battleId, user);
    return send(res, 200, true, "Token generado", data);
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   LISTA DE BEATS LOCALES
=========================================================== */
exports.listLocalBeats = async (_req, res) => {
  try {
    const beats = await battleService.listLocalBeats();
    return send(res, 200, true, "Beats locales disponibles", { beats });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   ELIMINAR BATALLA
   - Solo el creador de la batalla o un admin puede eliminarla
   - Se elimina en cascada: participantes, rounds, votos, comentarios
=========================================================== */
exports.deleteBattle = async (req, res) => {
  try {
    const battleId = parseInt(req.params.id);
    const userId = req.user.userId;
    const userRole = req.user.role; // Asumiendo que el middleware auth agrega el role

    if (!battleId || isNaN(battleId)) {
      return send(res, 400, false, "ID de batalla inválido");
    }

    // Obtener información de la batalla
    const battle = await battleService.getBattleById(battleId);

    if (!battle) {
      return send(res, 404, false, "Batalla no encontrada");
    }

    // Verificar permisos: admin O creador
    const isAdmin = userRole === 'admin';
    const isCreator = battle.created_by === userId;

    if (!isAdmin && !isCreator) {
      return send(res, 403, false, "No tienes permisos para eliminar esta batalla");
    }

    // Eliminar batalla (en cascada)
    await battleService.deleteBattleService(battleId);

    return send(res, 200, true, "Batalla eliminada exitosamente");
  } catch (err) {
    console.error("Error eliminando batalla:", err);
    return send(res, 500, false, err.message);
  }
};
