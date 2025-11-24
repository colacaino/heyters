import clsx from "clsx";

const TURN_COLORS = {
  mc1: "from-sky-500/40 to-sky-700/20 border-sky-400 text-sky-200",
  mc2: "from-fuchsia-500/40 to-fuchsia-700/20 border-fuchsia-400 text-fuchsia-200",
  default: "from-gray-700/30 to-gray-900/30 border-gray-600 text-gray-100",
};

function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function RoundTimer({
  timeRemaining = 0,
  roundState = "pending",
  currentTurn = "mc1",
  mcInfo = {},
}) {
  const colorClass = TURN_COLORS[currentTurn] || TURN_COLORS.default;
  const name = mcInfo[currentTurn]?.displayName || mcInfo[currentTurn]?.username;

  return (
    <div
      className={clsx(
        "rounded-2xl border-2 p-6 text-center shadow-inner bg-gradient-to-br",
        colorClass
      )}
    >
      <p className="text-sm tracking-widest uppercase text-gray-300">{roundState}</p>
      <p className="text-5xl md:text-6xl font-black mt-2">{formatTime(timeRemaining)}</p>
      <p className="mt-2 text-lg font-semibold">
        Turno: <span className="uppercase">{currentTurn}</span>
      </p>
      {name && <p className="text-md text-gray-200">{name}</p>}
    </div>
  );
}
