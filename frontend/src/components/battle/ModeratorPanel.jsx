import BattleControls from "./BattleControls";
import MCStatusIndicator from "./MCStatusIndicator";
import RoundTimer from "./RoundTimer";

/**
 * Panel extendido para moderadores con toda la información clave de la batalla.
 */
export default function ModeratorPanel({
  battle,
  socket,
  isController,
  mcInfo = { mc1: {}, mc2: {} },
  onStartBattle,
  onStartRound,
  onNextTurn,
  onEndRound,
  onFinishBattle,
}) {
  if (!battle) return null;

  return (
    <div className="bg-gray-950 border-2 border-gray-800 rounded-2xl p-5 space-y-5">
      <h2 className="text-lg font-bold text-white uppercase tracking-wide">
        Panel del Moderador
      </h2>

      <RoundTimer
        timeRemaining={battle.roundTimeRemaining}
        roundState={battle.roundState}
        currentTurn={battle.currentTurn}
        mcInfo={mcInfo}
      />

      <MCStatusIndicator
        currentTurn={battle.currentTurn}
        mc1={mcInfo.mc1}
        mc2={mcInfo.mc2}
      />

      <BattleControls
        socket={socket}
        battleId={battle.id}
        battleState={battle.battleState}
        roundState={battle.roundState}
        currentRound={battle.currentRound}
        currentTurn={battle.currentTurn}
        isController={isController}
        onStartBattle={onStartBattle}
        onStartRound={onStartRound}
        onNextTurn={onNextTurn}
        onEndRound={onEndRound}
        onFinishBattle={onFinishBattle}
      />

      <div className="text-xs text-gray-500">
        <p>Última actualización: {new Date().toLocaleTimeString()}</p>
        <p>Round ID activo: {battle.activeRoundId || "N/A"}</p>
      </div>
    </div>
  );
}
