import clsx from "clsx";

function MCCard({ label, active = false, info = {} }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
        active
          ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
          : "border-gray-700 bg-gray-800"
      )}
    >
      <div>
        {info.avatarUrl ? (
          <img
            src={info.avatarUrl}
            alt={info.displayName || info.username || label}
            className="w-12 h-12 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">
            {(info.displayName || info.username || label).slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-lg font-semibold">{info.displayName || info.username || "Sin asignar"}</p>
        {active && <p className="text-emerald-300 text-sm">En escena ahora</p>}
      </div>
    </div>
  );
}

export default function MCStatusIndicator({ currentTurn = "mc1", mc1 = {}, mc2 = {} }) {
  return (
    <div className="space-y-3">
      <MCCard label="MC1" active={currentTurn === "mc1"} info={mc1} />
      <MCCard label="MC2" active={currentTurn === "mc2"} info={mc2} />
    </div>
  );
}
