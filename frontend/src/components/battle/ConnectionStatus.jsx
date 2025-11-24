import clsx from "clsx";

const STATUS_COLORS = {
  connected: "text-emerald-400",
  connecting: "text-amber-400",
  checking: "text-amber-400",
  failed: "text-rose-400",
  disconnected: "text-rose-400",
};

export default function ConnectionStatus({
  ping = null,
  iceState = "checking",
  reconnecting = false,
}) {
  const color = STATUS_COLORS[iceState] || "text-gray-400";
  const pingLabel = ping === null ? "-- ms" : `${ping} ms`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 uppercase tracking-wide">Conexión</p>
        <span className={clsx("text-sm font-semibold", color)}>{iceState}</span>
      </div>
      <div className="flex items-center justify-between text-gray-200">
        <p className="text-lg font-bold">{pingLabel}</p>
        <span className="text-xs uppercase tracking-wide text-gray-500">Ping</span>
      </div>
      {reconnecting && (
        <p className="text-xs text-amber-400">Intentando reconectar con la batalla…</p>
      )}
    </div>
  );
}
