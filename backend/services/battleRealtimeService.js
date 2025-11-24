// services/battleRealtimeService.js
/**
 * Servicio centralizado para emitir eventos de batallas y manejar timers
 * sincronizados desde el servidor.
 */
const timers = new Map();
let ioRef = null;

function registerBattleRealtime(io) {
  ioRef = io;
}

function toBattleRoom(battleId) {
  return `battle_${battleId}`;
}

function emitBattleEvent(battleId, event, payload = {}) {
  if (!ioRef) return;
  ioRef.to(toBattleRoom(battleId)).emit(event, payload);
}

function emitBattleState(battleId, state) {
  emitBattleEvent(battleId, "battle:update_state", { battleId, state });
}

function startRoundTimer({ battleId, duration, onTick, onTimeout }) {
  stopRoundTimer(battleId);

  if (!duration || duration <= 0) {
    if (typeof onTimeout === "function") {
      onTimeout().catch((err) =>
        console.error("[BattleRealtime] Error ejecutando timeout inmediato:", err)
      );
    }
    return;
  }

  const timer = {
    remaining: duration,
    processing: false,
  };

  timer.interval = setInterval(async () => {
    if (timer.processing) return;
    timer.processing = true;

    try {
      timer.remaining = Math.max(timer.remaining - 1, 0);

      if (timer.remaining > 0) {
        if (typeof onTick === "function") {
          await onTick(timer.remaining);
        }
      } else {
        stopRoundTimer(battleId);
        if (typeof onTick === "function") {
          await onTick(0);
        }
        if (typeof onTimeout === "function") {
          await onTimeout();
        }
      }
    } catch (err) {
      console.error("[BattleRealtime] Error en timer de batalla:", err);
    } finally {
      timer.processing = false;
    }
  }, 1000);

  timers.set(battleId, timer);
}

function stopRoundTimer(battleId) {
  const timer = timers.get(battleId);
  if (timer) {
    clearInterval(timer.interval);
    timers.delete(battleId);
  }
}

module.exports = {
  registerBattleRealtime,
  emitBattleEvent,
  emitBattleState,
  startRoundTimer,
  stopRoundTimer,
};
