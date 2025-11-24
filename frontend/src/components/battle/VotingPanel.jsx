export default function VotingPanel({
  mc1,
  mc2,
  voteCounts = {},
  onVote,
  disabled = false,
  hasVoted = false,
}) {
  const buttons = [
    { label: mc1?.displayName || mc1?.username || "MC1", targetId: mc1?.userId },
    { label: mc2?.displayName || mc2?.username || "MC2", targetId: mc2?.userId },
  ].filter((btn) => btn.targetId);

  return (
    <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-300 uppercase tracking-wide">Votación en vivo</p>
        {hasVoted && <span className="text-xs text-emerald-400">Gracias por tu voto</span>}
      </div>
      {buttons.length === 0 ? (
        <p className="text-sm text-gray-400">Asigna MC1 y MC2 para habilitar la votación.</p>
      ) : (
        <div className="grid gap-3">
          {buttons.map((btn) => (
            <button
              key={btn.targetId}
              className={`px-4 py-3 rounded-lg border border-white/20 text-left transition ${
                hasVoted
                  ? "bg-gray-800 text-gray-400 cursor-default"
                  : "bg-white/5 hover:bg-white/15"
              }`}
              disabled={disabled || hasVoted}
              onClick={() => onVote(btn.targetId)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{btn.label}</span>
                <span className="text-sm text-emerald-300">
                  {voteCounts[btn.targetId] || 0} votos
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {disabled && (
        <p className="text-xs text-yellow-300">La votación se habilita cuando el round está activo.</p>
      )}
    </div>
  );
}
