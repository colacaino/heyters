const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battleController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createLimiter, voteLimiter } = require("../middleware/security");
const {
  createBattleValidation,
  battleIdValidation,
  joinBattleValidation,
  voteValidation,
  selectBeatValidation,
  battleListValidation,
} = require("../middleware/validators");

// Crear batalla - con rate limiting y validación
router.post(
  "/",
  authMiddleware,
  createLimiter,
  createBattleValidation,
  battleController.createBattle
);

// Listar batallas - con validación de query params
router.get("/", battleListValidation, battleController.listBattles);

// Agregar participante - con validación
router.post(
  "/participant/:battleId",
  authMiddleware,
  joinBattleValidation,
  battleController.addParticipant
);

// Iniciar batalla - con validación
router.post(
  "/start/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.startBattle
);

// Control del round - con validaciones
router.post(
  "/round/start/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.startRound
);

router.post(
  "/round/next-turn/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.nextTurn
);

router.post(
  "/round/end/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.endRound
);

// Finalizar batalla - con validación
router.post(
  "/end/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.endBattle
);

router.post(
  "/finish/:battleId",
  authMiddleware,
  battleIdValidation,
  battleController.endBattle
);

// Registrar voto - con rate limiting y validación estricta
router.post(
  "/:battleId/vote",
  authMiddleware,
  voteLimiter,
  voteValidation,
  battleController.voteBattle
);

// Seleccionar beat - con validación
router.post(
  "/:battleId/select-beat",
  authMiddleware,
  selectBeatValidation,
  battleController.selectBeat
);

router.get(
  "/beats/local",
  authMiddleware,
  battleController.listLocalBeats
);

router.post(
  "/:battleId/join-private",
  authMiddleware,
  battleIdValidation,
  battleController.joinPrivate
);

// Obtener token LiveKit - con validación
router.get(
  "/:battleId/join-token",
  authMiddleware,
  battleIdValidation,
  battleController.getJoinToken
);

// Obtener detalles completos - con validación
router.get("/:battleId", battleIdValidation, battleController.getBattleDetails);

module.exports = router;
