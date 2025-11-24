import { useMemo } from "react";

/**
 * Controles principales de batalla (solo moderadores / MC1).
 * Puede usar handlers personalizados o emitir eventos por socket.io.
 */
export default function BattleControls({
  socket,
  battleId,
  battleState = "pending",
  roundState = "pending",
  currentRound = 1,
  currentTurn = "mc1",
  isController = false,
  onStartBattle,
  onStartRound,
  onNextTurn,
  onEndRound,
  onFinishBattle,
}) {
  const disabled = !isController;

  const stateLabel = useMemo(() => {
    return `Round ${currentRound} · Turno ${currentTurn?.toUpperCase() || "-"}`;
  }, [currentRound, currentTurn]);

  const emit = (event, payload = {}) => {
    if (!socket) return;
    socket.emit(event, { battleId, ...payload });
  };

  const handleClick = (handler, fallbackEvent, payload) => {
    if (handler) {
      handler(payload);
    } else {
      emit(fallbackEvent, payload);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Estado batalla</p>
          <p className="text-lg font-semibold text-white">
            {battleState?.toUpperCase()} · {roundState?.toUpperCase()}
          </p>
          <p className="text-sm text-gray-400">{stateLabel}</p>
        </div>
        {!isController && (
          <span className="text-xs text-gray-500">Solo MC1 / Moderador controla</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="px-3 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
          disabled={disabled || battleState === "running"}
          onClick={() => handleClick(onStartBattle, "battle:start")}
        >
          Iniciar Batalla
        </button>

        <button
          className="px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40"
          disabled={disabled || roundState === "running"}
          onClick={() => handleClick(onStartRound, "battle:start_round", { roundNumber: currentRound })}
        >
          Iniciar Round
        </button>

        <button
          className="px-3 py-2 rounded-lg font-semibold bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-40"
          disabled={disabled || roundState !== "running"}
          onClick={() => handleClick(onNextTurn, "battle:next_turn")}
        >
          Siguiente Turno
        </button>

        <button
          className="px-3 py-2 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40"
          disabled={disabled || roundState !== "running"}
          onClick={() => handleClick(onEndRound, "battle:end_round")}
        >
          Finalizar Round
        </button>
      </div>

      <button
        className="w-full px-3 py-2 mt-2 rounded-lg font-semibold bg-red-700 text-white hover:bg-red-600 disabled:opacity-40"
        disabled={disabled || battleState === "finished"}
        onClick={() => handleClick(onFinishBattle, "battle:finish")}
      >
        Finalizar Batalla
      </button>
    </div>
  );
}
