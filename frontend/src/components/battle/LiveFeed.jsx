/**
 * Timeline simple para mostrar eventos relevantes durante la batalla.
 */
export default function LiveFeed({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-900/70 border border-white/10 rounded-xl p-4 text-sm text-gray-400">
        Aquí verás los eventos importantes de la batalla: inicios de round, cambios de turno y
        movimientos del público.
      </div>
    );
  }

  return (
    <div className="bg-gray-900/70 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="text-sm">
          <p className="text-gray-200">{entry.message}</p>
          <p className="text-xs text-gray-500">{entry.timestamp}</p>
        </div>
      ))}
    </div>
  );
}
