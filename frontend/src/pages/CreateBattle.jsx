import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";

export default function CreateBattle() {
  const { user, initializing } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [roundTime, setRoundTime] = useState(60);
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("1v1");
  const [language, setLanguage] = useState("es");
  const [maxRounds, setMaxRounds] = useState(3);
  const [myRole, setMyRole] = useState("moderator");

  // Estado para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBattleId, setCreatedBattleId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    if (!initializing && !user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPrivate) {
      if (!password.trim()) {
        alert("Debes establecer una contraseña para batallas privadas");
        return;
      }
      if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
      }
    }

    try {
      const res = await axios.post("/battles", {
        title,
        description,
        visibility: isPrivate ? "private" : "public",
        mode,
        language,
        maxRounds: Number(maxRounds),
        roundDurationSeconds: Number(roundTime),
        password: isPrivate ? password : undefined,
      });

      const battleId = res.data?.data?.battle?.id;
      if (!battleId) {
        alert("No se pudo crear la batalla");
        return;
      }

      try {
        await axios.post(`/battles/participant/${battleId}`, {
          userId: user.id,
          role: myRole,
        });
      } catch (errJoin) {
        console.warn("No se pudo asignar rol automáticamente", errJoin);
      }

      // Mostrar modal con link y contraseña
      setCreatedBattleId(battleId);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error al crear la batalla");
    }
  };

  const getBattleLink = () => {
    return `${window.location.origin}/battle/${createdBattleId}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getBattleLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error("Error al copiar contraseña:", err);
    }
  };

  const goToBattle = () => {
    navigate(`/battle/${createdBattleId}`);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="opacity-70">Validando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout
      title="Diseña el combate perfecto"
      description="Define la visibilidad, duración y número de rondas. Comparte el enlace con los MCs una vez crees la batalla."
    >
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <form
          onSubmit={handleSubmit}
        className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 space-y-5"
      >
          <div>
            <label className="font-semibold text-gray-300">Título</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-800 mt-1"
              placeholder="Ej: Carlos vs Colacao"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-300">Descripción (opcional)</label>
            <textarea
              className="w-full p-2 rounded bg-gray-800 mt-1 h-24"
              placeholder="Describe la batalla..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-300">Duración por ronda (segundos)</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 mt-1"
                value={roundTime}
                min={10}
                max={300}
                onChange={(e) => setRoundTime(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-gray-300">N° de rondas</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-gray-800 mt-1"
                value={maxRounds}
                min={1}
                max={10}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="font-semibold text-gray-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Batalla privada
              </label>
              {isPrivate && (
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <input
                    type="password"
                    className="w-full p-2 rounded bg-gray-800"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full p-2 rounded bg-gray-800"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="font-semibold text-gray-300">Modo</label>
              <select
                className="w-full p-2 rounded bg-gray-800 mt-1"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="1v1">1 vs 1</option>
                <option value="2v2">2 vs 2</option>
                <option value="openmic">Open Mic</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-gray-300">Idioma</label>
              <select
                className="w-full p-2 rounded bg-gray-800 mt-1"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-300">Mi rol en esta batalla</label>
            <select
              className="w-full p-2 rounded bg-gray-800 mt-1"
              value={myRole}
              onChange={(e) => setMyRole(e.target.value)}
            >
              <option value="moderator">Moderador (controlo la batalla)</option>
              <option value="mc1">MC 1 (voy a rapear)</option>
              <option value="mc2">MC 2 (voy a rapear)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {myRole === "moderator"
                ? "Como moderador controlarás los turnos y rondas"
                : "Como MC participarás rapeando en la batalla"}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-lg font-bold"
          >
            Crear Batalla
          </button>
        </form>

        <aside className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5 text-sm text-emerald-100 space-y-3">
          <h3 className="text-lg font-semibold text-emerald-300">Tips rápidos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Si la batalla es privada, comparte el enlace solo con MCs invitados.</li>
            <li>
              El moderador puede controlar rounds y turnos desde el panel de la vista de batalla.
            </li>
            <li>
              Recomienda a los participantes probar audio/video en la página de batalla antes de
              iniciar.
            </li>
          </ul>
        </aside>
      </div>

      {/* Modal de éxito con link y contraseña */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 border border-green-500/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">¡Batalla Creada!</h3>
              <p className="text-gray-400 text-sm mt-1">
                Comparte el enlace con los participantes
              </p>
            </div>

            {/* Link de la batalla */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Enlace de la batalla</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getBattleLink()}
                  className="flex-1 p-2 rounded bg-gray-900 text-sm text-gray-300 border border-gray-700"
                />
                <button
                  onClick={copyLink}
                  className={`px-3 py-2 rounded font-medium text-sm transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {copied ? "✓" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Contraseña si es privada */}
            {isPrivate && password && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Contraseña</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={password}
                    className="flex-1 p-2 rounded bg-gray-900 text-sm text-gray-300 border border-gray-700 font-mono"
                  />
                  <button
                    onClick={copyPassword}
                    className={`px-3 py-2 rounded font-medium text-sm transition-colors ${
                      copiedPassword
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {copiedPassword ? "✓" : "Copiar"}
                  </button>
                </div>
                <p className="text-xs text-yellow-400">
                  Comparte esta contraseña solo con los participantes invitados
                </p>
              </div>
            )}

            {/* Info del rol */}
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">
                Tu rol: <span className="text-white font-medium">
                  {myRole === "moderator" ? "Moderador" : myRole === "mc1" ? "MC 1" : "MC 2"}
                </span>
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setTitle("");
                  setDescription("");
                  setPassword("");
                  setConfirmPassword("");
                  setIsPrivate(false);
                  setCreatedBattleId(null);
                  setMyRole("moderator");
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium"
              >
                Crear otra
              </button>
              <button
                onClick={goToBattle}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium"
              >
                Ir a la batalla
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
