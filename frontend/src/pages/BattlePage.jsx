import {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import BattleControls from "../components/battle/BattleControls";
import RoundTimer from "../components/battle/RoundTimer";
import MCStatusIndicator from "../components/battle/MCStatusIndicator";
import ConnectionStatus from "../components/battle/ConnectionStatus";
import LiveFeed from "../components/battle/LiveFeed";
import VotingPanel from "../components/battle/VotingPanel";
import { BEATS } from "../data/beats";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";



const LK_TRACK_SOURCES = [
  { source: Track.Source.Camera, withPlaceholder: true },
  { source: Track.Source.ScreenShare, withPlaceholder: true },
  { source: Track.Source.Microphone, withPlaceholder: true },
];

export default function BattlePage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user, initializing, isPro } = useContext(AuthContext);

  const [battle, setBattle] = useState(null);
  const [socket, setSocket] = useState(null);
  const [feed, setFeed] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [livekitInfo, setLivekitInfo] = useState(null);
  const [livekitState, setLivekitState] = useState("connecting");
  const [localBeats, setLocalBeats] = useState([]);
  const [selectedBeat, setSelectedBeat] = useState(BEATS[0]?.url || "");
  const [currentBeat, setCurrentBeat] = useState(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [beatProgress, setBeatProgress] = useState({ current: 0, duration: 0 });
  const [beatVolume, setBeatVolume] = useState(0.9);
  const audioRef = useRef(null);
  const currentBeatRef = useRef(null);
  const pendingBeatAutoplay = useRef(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const playBeat = useCallback(
    (restart = false) => {
      const audio = audioRef.current;
      if (!audio || !currentBeatRef.current) return;
      try {
        if (restart) {
          audio.currentTime = 0;
        }
        const playPromise = audio.play();
        if (playPromise?.then) {
          playPromise
            .then(() => {
              setIsBeatPlaying(true);
            })
            .catch((err) => {
              console.error("Error al reproducir beat:", err);
              setIsBeatPlaying(false);
              // Error común: usuario no ha interactuado con la página
              if (err.name === "NotAllowedError") {
                console.warn("Reproducción bloqueada: el usuario debe interactuar primero");
              }
            });
        } else {
          setIsBeatPlaying(true);
        }
      } catch (err) {
        console.error("No se pudo reproducir el beat", err);
        setIsBeatPlaying(false);
      }
    },
    []
  );

  const pauseBeat = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsBeatPlaying(false);
  }, []);

  const stopBeat = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsBeatPlaying(false);
    setBeatProgress((prev) => ({ ...prev, current: 0 }));
  }, []);

  const handleSeek = useCallback((positionSeconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = positionSeconds;
    setBeatProgress((prev) => ({ ...prev, current: positionSeconds }));
  }, []);

  const handleVolumeChange = useCallback((value) => {
    setBeatVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const mergeBattleState = useCallback((stateUpdate) => {
    if (!stateUpdate) return;
    setBattle((prev) => {
      if (!prev) return { ...stateUpdate };
      return {
        ...prev,
        ...stateUpdate,
        participants: stateUpdate.participants || prev.participants,
        scoreboard: stateUpdate.scoreboard || prev.scoreboard,
      };
    });
  }, []);

  const currentTurn = battle?.currentTurn || "mc1";
  const availableBeats = useMemo(() => {
    if (localBeats.length === 0) return BEATS;
    return [...localBeats, ...BEATS];
  }, [localBeats]);

  const pushFeedEntry = useCallback((message) => {
    setFeed((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      return [entry, ...prev].slice(0, 30);
    });
  }, []);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (currentBeat) {
      audio.src = currentBeat;
      audio.load();
      setBeatProgress({ current: 0, duration: audio.duration || 0 });
      setIsBeatPlaying(false);

      // Esperar a que el audio esté listo antes de reproducir
      if (pendingBeatAutoplay.current) {
        const handleCanPlay = () => {
          playBeat(true);
          pendingBeatAutoplay.current = false;
          audio.removeEventListener("canplaythrough", handleCanPlay);
        };
        audio.addEventListener("canplaythrough", handleCanPlay);
      }
    } else {
      stopBeat();
    }
  }, [currentBeat, playBeat, stopBeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = beatVolume;
    }
  }, [beatVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoaded = () => {
      setBeatProgress({
        current: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };
    const handleTimeUpdate = () => {
      setBeatProgress({
        current: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };
    const handleEnded = () => {
      setIsBeatPlaying(false);
      setBeatProgress((prev) => ({ ...prev, current: 0 }));
    };
    const handleError = (e) => {
      console.error("Error al cargar el beat:", e);
      console.error("URL del beat:", audio.src);
      setIsBeatPlaying(false);
    };
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!initializing && !user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  useEffect(() => {
    const fetchBattle = async () => {
      try {
        const res = await axios.get(`/battles/${battleId}`);
        mergeBattleState(res.data?.data?.battle || null);
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar esta batalla");
      }
    };
    fetchBattle();
  }, [battleId, mergeBattleState]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchLocalBeats = async () => {
      try {
        const res = await axios.get("/battles/beats/local");
        if (!mounted) return;
        setLocalBeats(res.data?.data?.beats || []);
      } catch (err) {
        console.error("No se pudieron cargar beats locales", err);
      }
    };
    fetchLocalBeats();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedBeat && availableBeats.length > 0) {
      setSelectedBeat(availableBeats[0].url);
    }
  }, [availableBeats, selectedBeat]);

  useEffect(() => {
    if (!user) return;

    const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:4000";
    const s = io(WS_URL);
    setSocket(s);

    const emitJoin = () => s.emit("battle:join", { battleId, userId: user.id });
    s.on("connect", emitJoin);
    s.io.on("reconnect", emitJoin);
    emitJoin();

    return () => {
      s.off("connect", emitJoin);
      s.io.off("reconnect", emitJoin);
      s.disconnect();
    };
  }, [battleId, user]);

  useEffect(() => {
    if (!user) return;
    axios
      .get(`/battles/${battleId}/join-token`)
      .then((res) => {
        setLivekitInfo(res.data?.data);
      })
      .catch((err) => {
        console.error(err);
        alert(err?.response?.data?.message || "No se pudo obtener token de LiveKit");
      });
  }, [battleId, user]);

  useEffect(() => {
    if (!socket) return;
    const eventMessages = {
      "battle:start": "La batalla ha comenzado.",
      "battle:start_round": "Nuevo round en curso.",
      "battle:next_turn": "Cambio de turno.",
      "battle:end_round": "Round finalizado.",
      "battle:finish": "La batalla ha terminado.",
    };

    const handlers = Object.keys(eventMessages).reduce((acc, eventName) => {
      acc[eventName] = ({ state }) => {
        if (state) mergeBattleState(state);
        pushFeedEntry(eventMessages[eventName]);
        if (eventName === "battle:start_round") {
          setHasVoted(false);
          setVoteCounts({});
          if (currentBeatRef.current) {
            playBeat(true);
          } else {
            pendingBeatAutoplay.current = true;
          }
        }
        if (eventName === "battle:end_round" || eventName === "battle:finish") {
          stopBeat();
          setCurrentBeat(null);
        }
      };
      socket.on(eventName, acc[eventName]);
      return acc;
    }, {});

    const updateHandler = ({ state }) => mergeBattleState(state);
    socket.on("battle:update_state", updateHandler);

    const voteHandler = ({ votes }) => {
      const mapped = votes.reduce((acc, v) => {
        acc[v.targetUserId] = v.total;
        return acc;
      }, {});
      setVoteCounts(mapped);
    };
    socket.on("battle:vote_cast", voteHandler);

    const joinHandler = ({ userId }) => {
      if (userId !== user?.id) pushFeedEntry(`Nuevo usuario ${userId} se conectó a la sala.`);
    };
    socket.on("battle:user_joined", joinHandler);

    const beatHandler = ({ beatUrl, roundNumber }) => {
      if (beatUrl) {
        setCurrentBeat(beatUrl);
        setSelectedBeat(beatUrl);
        pushFeedEntry(`Beat sincronizado para el round ${roundNumber || ""}`);
      }
    };
    socket.on("battle:beat_selected", beatHandler);

    // Chat handler
    const chatHandler = (message) => {
      setChatMessages((prev) => [...prev, message].slice(-100));
    };
    socket.on("battle:chat_message", chatHandler);

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      socket.off("battle:update_state", updateHandler);
      socket.off("battle:vote_cast", voteHandler);
      socket.off("battle:user_joined", joinHandler);
      socket.off("battle:beat_selected", beatHandler);
      socket.off("battle:chat_message", chatHandler);
    };
  }, [socket, pushFeedEntry, user, mergeBattleState, playBeat, stopBeat]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const currentParticipant = useMemo(() => {
    if (!battle || !user) return null;
    const participant =
      battle.participants?.find(
        (p) =>
          p.user_id === user.id ||
          p.userId === user.id ||
          p.user?.id === user.id
      ) || null;
    return participant || null;
  }, [battle, user]);

  const myRole = (currentParticipant?.role || "").toLowerCase() || null;
  const isController = myRole === "moderator";

  const mcInfo = useMemo(() => {
    const info = { mc1: {}, mc2: {}, moderator: {} };
    (battle?.participants || []).forEach((p) => {
      const role = p.role?.toLowerCase();
      const mapped = {
        displayName: p.display_name || p.displayName,
        username: p.username,
        avatarUrl: p.avatar_url || p.avatarUrl,
        userId: p.user_id || p.userId,
      };
      if (role === "mc1") info.mc1 = mapped;
      if (role === "mc2") info.mc2 = mapped;
       if (role === "moderator") info.moderator = mapped;
    });
    return info;
  }, [battle]);

  const livekitRoleMap = useMemo(() => {
    const map = {};
    (battle?.participants || []).forEach((p) => {
      const userId = p.user_id || p.userId || p.user?.id;
      if (!userId) return;
      const identity = `user_${userId}`;
      map[identity] = p.role?.toLowerCase();
    });
    return map;
  }, [battle]);

  const backgroundClass = useMemo(() => {
    if (currentTurn === "mc2") return "from-purple-950 via-gray-950 to-black";
    if (currentTurn === "mc1") return "from-blue-950 via-gray-950 to-black";
    return "from-gray-950 to-black";
  }, [currentTurn]);

  const handleStartBattle = async () => {
    try {
      await axios.post(`/battles/start/${battleId}`);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo iniciar la batalla");
    }
  };

  const handleStartRound = async () => {
    try {
      await axios.post(`/battles/round/start/${battleId}`);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo iniciar el round");
    }
  };

  const handleNextTurn = async () => {
    try {
      await axios.post(`/battles/round/next-turn/${battleId}`);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo avanzar al siguiente turno");
    }
  };

  const handleEndRound = async () => {
    try {
      await axios.post(`/battles/round/end/${battleId}`);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo finalizar el round");
    }
  };

  const handleFinishBattle = async () => {
    try {
      await axios.post(`/battles/finish/${battleId}`);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo finalizar la batalla");
    }
  };

  const handleVote = async (targetUserId) => {
    try {
      await axios.post(`/battles/${battleId}/vote`, { targetUserId });
      setHasVoted(true);
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo registrar tu voto");
    }
  };

  const handleSelectBeat = async () => {
    try {
      await axios.post(`/battles/${battleId}/select-beat`, {
        beatUrl: selectedBeat,
        roundNumber: battle?.currentRound || 1,
      });
      pushFeedEntry("Beat asignado para el próximo round");
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo asignar el beat");
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit("battle:send_chat", {
      battleId,
      userId: user.id,
      username: user.displayName || user.username,
      message: chatInput.trim(),
    });
    setChatInput("");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="opacity-70">Preparando batalla...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Basic users see limited content
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <span className="text-6xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Contenido Exclusivo Pro</h1>
          <p className="text-gray-400 mb-6">
            Las batallas en vivo son exclusivas para usuarios Pro.
            Con el Plan Pro podrás ver, participar y votar en todas las batallas.
          </p>

          {battle && (
            <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-lg mb-6 text-left">
              <h2 className="text-xl font-semibold mb-2">{battle.title}</h2>
              <p className="text-gray-400 text-sm">
                Estado: {(battle.battleState || battle.status || "pending").toUpperCase()}
              </p>
              <p className="text-gray-400 text-sm">
                Rondas: {battle.maxRounds} · Duración: {battle.roundDurationSeconds || 60}s
              </p>
              {battle.participants && battle.participants.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Participantes:</p>
                  <div className="flex flex-wrap gap-2">
                    {battle.participants.map((p, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded">
                        {p.display_name || p.displayName || `User ${p.user_id}`} ({p.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/payment")}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-500 hover:to-pink-500"
            >
              ⭐ Hazte Pro
            </button>
            <button
              onClick={() => navigate("/home")}
              className="px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700"
            >
              ← Volver al Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white p-6 bg-gradient-to-br ${backgroundClass}`}>
      <audio ref={audioRef} className="hidden" />
      <h1 className="text-3xl font-bold mb-4">Batalla #{battleId}</h1>

      {battle ? (
        <div className="bg-gray-900/60 border border-gray-800 p-4 rounded-lg mb-6 backdrop-blur">
          <h2 className="text-xl font-semibold">{battle.title}</h2>
          <p className="text-gray-400">
            Rondas: {battle.roundDurationSeconds || 0}s · Máx. {battle.maxRounds}
          </p>
          <p className="text-gray-400">
            Estado: {(battle.battleState || battle.status || "pending").toUpperCase()}
          </p>
        </div>
      ) : (
        <p className="opacity-70 mb-6">Cargando detalles de la batalla...</p>
      )}

  <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/80 backdrop-blur p-4 rounded-lg border border-gray-800 min-h-[420px]">
            {livekitInfo ? (
              <LiveKitRoom
                audio={livekitInfo.canPublish}
                video={livekitInfo.canPublish}
                token={livekitInfo.token}
                serverUrl={livekitInfo.url}
                connect={true}
              >
                <StageView
                  canPublish={livekitInfo.canPublish}
                  participantRoles={livekitRoleMap}
                  mcInfo={mcInfo}
                  myRole={myRole}
                  isModerator={isController}
                  currentTurn={currentTurn}
                  socket={socket}
                  battleId={battleId}
                  user={user}
                  onConnectionStateChange={setLivekitState}
                />
              </LiveKitRoom>
            ) : (
              <p className="opacity-70">Conectando a la sala de LiveKit...</p>
            )}
          </div>

          <ConnectionStatus
            ping={null}
            iceState={livekitState}
            reconnecting={livekitState !== "connected"}
          />
        </div>

        <div className="space-y-4">
          <RoundTimer
            timeRemaining={battle?.roundTimeRemaining || 0}
            roundState={battle?.roundState || "pending"}
            currentTurn={currentTurn}
            mcInfo={mcInfo}
          />

          <MCStatusIndicator currentTurn={currentTurn} mc1={mcInfo.mc1} mc2={mcInfo.mc2} />

          <VotingPanel
            mc1={mcInfo.mc1}
            mc2={mcInfo.mc2}
            voteCounts={voteCounts}
            hasVoted={hasVoted}
            disabled={battle?.roundState !== "running"}
            onVote={handleVote}
          />

          {isController && (
            <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-sm text-gray-300">Selecciona el beat para el pr�ximo round</p>
              <select
                className="w-full bg-gray-800 rounded-lg p-2 text-sm"
                value={selectedBeat}
                onChange={(e) => setSelectedBeat(e.target.value)}
              >
                {availableBeats.map((beat) => (
                  <option key={beat.id} value={beat.url}>
                    {beat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Coloca tus MP3 en <code>backend/public/beats</code> para verlos aqu�.
              </p>
              <button
                onClick={handleSelectBeat}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500"
              >
                Guardar beat
              </button>

              <BeatControlPanel
                currentBeat={currentBeat}
                availableBeats={availableBeats}
                isPlaying={isBeatPlaying}
                progress={beatProgress}
                volume={beatVolume}
                onPlay={() => playBeat(false)}
                onRestart={() => playBeat(true)}
                onPause={pauseBeat}
                onStop={stopBeat}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
              />
            </div>
          )}

          {!isController && currentBeat && (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Beat en escena</p>
              <p className="text-sm text-gray-100 font-semibold">
                {availableBeats.find((beat) => beat.url === currentBeat)?.name ||
                  "Beat personalizado"}
              </p>
              <p className="text-xs text-gray-500 mt-1">El moderador controla cu�ndo suena.</p>
            </div>
          )}
          <BattleControls
            socket={socket}
            battleId={battleId}
            battleState={battle?.battleState || battle?.status || "pending"}
            roundState={battle?.roundState || "pending"}
            currentRound={battle?.currentRound || 1}
            currentTurn={currentTurn}
            isController={isController}
            onStartBattle={handleStartBattle}
            onStartRound={handleStartRound}
            onNextTurn={handleNextTurn}
            onEndRound={handleEndRound}
            onFinishBattle={handleFinishBattle}
          />

          <LiveFeed entries={feed} />

          {/* Chat en vivo */}
          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Chat en Vivo</h3>
            <div className="h-48 overflow-y-auto bg-black/30 rounded-lg p-2 mb-3 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  No hay mensajes aún. ¡Sé el primero!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className={`font-semibold ${msg.userId === user.id ? "text-blue-400" : "text-green-400"}`}>
                      {msg.username}:
                    </span>{" "}
                    <span className="text-gray-300">{msg.message}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm placeholder-gray-500"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/home")}
        className="inline-block mt-6 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
      >
        Volver al Home
      </button>
    </div>
  );
}

function StageView({
  canPublish,
  participantRoles,
  mcInfo,
  myRole,
  isModerator,
  currentTurn,
  socket,
  battleId,
  user,
  onConnectionStateChange,
}) {
  const tracks = useTracks(LK_TRACK_SOURCES, { onlySubscribed: false });
  const room = useRoomContext();
  const [mediaState, setMediaState] = useState({ camera: false, microphone: false });
  const [deviceLocks, setDeviceLocks] = useState({ camera: false, microphone: false });
  const hasAutoPublished = useRef(false);

  const cameraTracks = useMemo(
    () => tracks.filter((trackRef) => trackRef.source === Track.Source.Camera),
    [tracks]
  );

  const { mcSlots, moderatorTrack, standbyTracks } = useMemo(() => {
    const slots = { mc1: null, mc2: null };
    const standby = [];
    let modTrack = null;

    cameraTracks.forEach((trackRef) => {
      const identity = trackRef.participant?.identity;
      const role = identity ? participantRoles?.[identity] : undefined;
      if (role === "mc1" || role === "mc2") {
        if (!slots[role]) slots[role] = trackRef;
        return;
      }
      if (role === "moderator") {
        modTrack = modTrack || trackRef;
        return;
      }
      standby.push(trackRef);
    });

    if (myRole === "moderator" && !modTrack && room?.localParticipant) {
      modTrack = {
        participant: room.localParticipant,
        source: Track.Source.Camera,
      };
    }

    return { mcSlots: slots, moderatorTrack: modTrack, standbyTracks: standby };
  }, [cameraTracks, participantRoles, myRole, room]);

  useEffect(() => {
    if (!room) return;
    const handler = () => {
      onConnectionStateChange(room.state);
    };
    room.on(RoomEvent.ConnectionStateChanged, handler);
    handler();
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, handler);
    };
  }, [room, onConnectionStateChange]);

  useEffect(() => {
    if (!room?.localParticipant) return;
    setMediaState({
      camera: room.localParticipant.isCameraEnabled ?? false,
      microphone: room.localParticipant.isMicrophoneEnabled ?? false,
    });
  }, [room]);

  useEffect(() => {
    if (!room || !canPublish || hasAutoPublished.current || !room.localParticipant) return;
    hasAutoPublished.current = true;
    Promise.all([
      room.localParticipant.setCameraEnabled(true),
      room.localParticipant.setMicrophoneEnabled(true),
    ])
      .catch((err) => console.error("No se pudieron activar los dispositivos", err))
      .finally(() => {
        setMediaState({
          camera: room.localParticipant.isCameraEnabled ?? false,
          microphone: room.localParticipant.isMicrophoneEnabled ?? false,
        });
      });
  }, [room, canPublish]);

  useEffect(() => {
    if (!socket || !room || !user?.id) return;
    const handler = async ({ targetUserId, device, action }) => {
      if (Number(targetUserId) !== Number(user.id)) return;
      if (!room.localParticipant) return;
      const enable = action !== "disable";
      try {
        if (device === "camera") {
          await room.localParticipant.setCameraEnabled(enable);
          if (!isModerator) {
            setDeviceLocks((prev) => ({ ...prev, camera: action === "disable" }));
          }
        } else {
          await room.localParticipant.setMicrophoneEnabled(enable);
          if (!isModerator) {
            setDeviceLocks((prev) => ({ ...prev, microphone: action === "disable" }));
          }
        }
        setMediaState({
          camera: room.localParticipant.isCameraEnabled ?? false,
          microphone: room.localParticipant.isMicrophoneEnabled ?? false,
        });
      } catch (err) {
        console.error("No se pudo aplicar control del moderador", err);
      }
    };
    socket.on("battle:device_command", handler);
    return () => {
      socket.off("battle:device_command", handler);
    };
  }, [socket, room, user, isModerator]);

  const toggleCamera = async () => {
    if (!room?.localParticipant || !canPublish) return;
    if (deviceLocks.camera && !isModerator) return;
    const next = !mediaState.camera;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setMediaState((prev) => ({ ...prev, camera: next }));
    } catch (err) {
      console.error("No se pudo cambiar estado de camara", err);
    }
  };

  const toggleMicrophone = async () => {
    if (!room?.localParticipant || !canPublish) return;
    if (deviceLocks.microphone && !isModerator) return;
    const next = !mediaState.microphone;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMediaState((prev) => ({ ...prev, microphone: next }));
    } catch (err) {
      console.error("No se pudo cambiar estado de microfono", err);
    }
  };

  const sendDeviceCommand = useCallback(
    (role, device, action) => {
      if (!socket || !battleId || !user?.id) return;
      const targetUserId = mcInfo?.[role]?.userId;
      if (!targetUserId) return;
      socket.emit(
        "battle:device_control",
        {
          battleId,
          userId: user.id,
          targetUserId,
          device,
          action,
        },
        (response) => {
          if (response && response.success === false) {
            console.error("No se pudo enviar comando:", response.message);
          }
        }
      );
    },
    [socket, battleId, user, mcInfo]
  );

  return (
    <div className="space-y-4">
      <RoomAudioRenderer />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <StageSlot
            label="MC1"
            trackRef={mcSlots.mc1}
            participant={mcInfo.mc1}
            isActive={currentTurn === "mc1"}
          />
          <StageSlot
            label="MC2"
            trackRef={mcSlots.mc2}
            participant={mcInfo.mc2}
            isActive={currentTurn === "mc2"}
          />
        </div>
        <ModeratorSlot
          trackRef={moderatorTrack}
          participant={mcInfo.moderator}
          isSelf={myRole === "moderator"}
        />
        {standbyTracks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {standbyTracks.map((trackRef) => {
              const participantId =
                trackRef.participant?.sid || trackRef.participant?.identity || "viewer";
              const trackKey =
                trackRef.publication?.trackSid || `${participantId}-${trackRef.source}`;
              return (
                <div
                  key={trackKey}
                  className="rounded-xl border border-white/10 overflow-hidden bg-black/60"
                >
                  <ParticipantTile trackRef={trackRef} displayName showMuteIndicator />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ControlBar
        variation="minimal"
        controls={{
          audio: canPublish,
          video: canPublish,
          screenShare: false,
          layout: false,
          chat: false,
        }}
      />
      {canPublish && (
        <MediaTogglePanel
          cameraEnabled={mediaState.camera}
          microphoneEnabled={mediaState.microphone}
          onToggleCamera={toggleCamera}
          onToggleMicrophone={toggleMicrophone}
          isModerator={isModerator}
          lockedDevices={deviceLocks}
        />
      )}
      {isModerator && (
        <ModeratorDeviceControls
          mcInfo={mcInfo}
          mcSlots={mcSlots}
          onCommand={sendDeviceCommand}
        />
      )}
    </div>
  );
}

function StageSlot({ label, trackRef, participant, isActive }) {
  if (trackRef) {
    const participantId =
      trackRef.participant?.sid || trackRef.participant?.identity || label;
    const trackKey =
      trackRef.publication?.trackSid || `${participantId}-${trackRef.source}`;
    return (
      <div
        className={`relative rounded-2xl border overflow-hidden min-h-[240px] ${
          isActive
            ? "border-emerald-400 shadow-emerald-500/40 shadow-lg"
            : "border-white/10"
        }`}
      >
        <ParticipantTile
          key={trackKey}
          trackRef={trackRef}
          displayName
          showMuteIndicator
        />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-xs font-semibold uppercase tracking-wide">
          {label}
        </div>
      </div>
    );
  }

  const displayName = participant?.displayName || participant?.username || `Esperando ${label}`;

  return (
    <div
      className={`rounded-2xl border border-dashed min-h-[240px] flex flex-col items-center justify-center text-center px-6 ${
        isActive ? "border-emerald-400 text-emerald-200" : "border-white/10 text-gray-400"
      }`}
    >
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-white mt-2">{displayName}</p>
      <p className="text-xs opacity-70 mt-1">Activa tu camara para aparecer en escena.</p>
    </div>
  );
}

function ModeratorSlot({ trackRef, participant, isSelf }) {
  if (trackRef) {
    const participantId =
      trackRef.participant?.sid || trackRef.participant?.identity || "moderator";
    const trackKey =
      trackRef.publication?.trackSid || `${participantId}-${trackRef.source}`;
    return (
      <div className="relative rounded-2xl border border-white/10 overflow-hidden min-h-[180px] bg-black/60">
        <ParticipantTile
          key={trackKey}
          trackRef={trackRef}
          displayName
          showMuteIndicator
        />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-xs font-semibold uppercase tracking-wide">
          Moderador
        </div>
        {isSelf && (
          <div className="absolute bottom-3 right-3 text-xs text-emerald-300 bg-black/60 px-2 py-1 rounded-full">
            Eres tu
          </div>
        )}
      </div>
    );
  }

  const displayName = participant?.displayName || participant?.username || "Moderador";
  return (
    <div className="rounded-2xl border border-dashed border-white/15 min-h-[160px] flex flex-col items-center justify-center text-center px-6 text-gray-400">
      <p className="text-xs uppercase tracking-wide">Moderador</p>
      <p className="text-lg font-semibold text-white mt-2">{displayName}</p>
      <p className="text-xs opacity-70 mt-1">Activa tu camara para aparecer junto a los MCs.</p>
    </div>
  );
}

function MediaTogglePanel({
  cameraEnabled,
  microphoneEnabled,
  onToggleCamera,
  onToggleMicrophone,
  isModerator,
  lockedDevices,
}) {
  return (
    <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {isModerator ? "Panel del moderador" : "Tus dispositivos en escena"}
        </p>
        <p className="text-sm text-gray-400">
          Controla tu microfono y camara sin salir de la batalla.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onToggleCamera}
          className={`rounded-xl border px-4 py-4 text-left transition ${
            cameraEnabled
              ? "border-emerald-400 bg-emerald-500/10"
              : "border-gray-700 bg-gray-800/70 hover:border-gray-500"
          } ${lockedDevices.camera && !isModerator ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Camara</p>
          <p className="text-lg font-semibold text-white">
            {cameraEnabled ? "Activa" : "Apagada"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cameraEnabled ? "Haz clic para ocultarte" : "Haz clic para mostrarte"}
          </p>
          {!isModerator && lockedDevices.camera && (
            <p className="text-xs text-rose-400 mt-2">El moderador apago tu camara.</p>
          )}
        </button>
        <button
          type="button"
          onClick={onToggleMicrophone}
          className={`rounded-xl border px-4 py-4 text-left transition ${
            microphoneEnabled
              ? "border-emerald-400 bg-emerald-500/10"
              : "border-gray-700 bg-gray-800/70 hover:border-gray-500"
          } ${lockedDevices.microphone && !isModerator ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Microfono</p>
          <p className="text-lg font-semibold text-white">
            {microphoneEnabled ? "Con sonido" : "Silenciado"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {microphoneEnabled ? "Haz clic para silenciar" : "Haz clic para hablar"}
          </p>
          {!isModerator && lockedDevices.microphone && (
            <p className="text-xs text-rose-400 mt-2">El moderador silencio tu micro.</p>
          )}
        </button>
      </div>
    </div>
  );
}

function ModeratorDeviceControls({ mcInfo, mcSlots, onCommand }) {
  const cards = [
    { key: "mc1", label: "MC1", participant: mcInfo.mc1, slot: mcSlots.mc1 },
    { key: "mc2", label: "MC2", participant: mcInfo.mc2, slot: mcSlots.mc2 },
  ];

  return (
    <div className="bg-gray-900/80 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-400">Control de MCs</p>
        <span className="text-xs text-emerald-300">Solo tu ves esto</span>
      </div>
      <div className="space-y-3">
        {cards.map(({ key, label, participant, slot }) => {
          const assigned = Boolean(participant?.userId);
          const cameraOn = Boolean(slot);
          const name = participant?.displayName || participant?.username || "Sin asignar";
          return (
            <div key={key} className="border border-white/10 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="font-semibold text-white">{name}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>Camara: {cameraOn ? "activa" : "sin senal"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  type="button"
                  disabled={!assigned}
                  onClick={() => onCommand(key, "camera", "disable")}
                  className="px-3 py-2 rounded-lg border border-rose-500/40 text-rose-200 disabled:opacity-40"
                >
                  Apagar camara
                </button>
                <button
                  type="button"
                  disabled={!assigned}
                  onClick={() => onCommand(key, "camera", "enable")}
                  className="px-3 py-2 rounded-lg border border-emerald-400/50 text-emerald-200 disabled:opacity-40"
                >
                  Encender camara
                </button>
                <button
                  type="button"
                  disabled={!assigned}
                  onClick={() => onCommand(key, "microphone", "disable")}
                  className="px-3 py-2 rounded-lg border border-rose-500/40 text-rose-200 disabled:opacity-40"
                >
                  Silenciar micro
                </button>
                <button
                  type="button"
                  disabled={!assigned}
                  onClick={() => onCommand(key, "microphone", "enable")}
                  className="px-3 py-2 rounded-lg border border-emerald-400/50 text-emerald-200 disabled:opacity-40"
                >
                  Activar micro
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}







function BeatControlPanel({
  currentBeat,
  availableBeats,
  isPlaying,
  progress,
  volume,
  onPlay,
  onRestart,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
}) {
  const beatName =
    availableBeats.find((beat) => beat.url === currentBeat)?.name || "Beat personalizado";
  const duration = Number.isFinite(progress.duration) ? progress.duration : 0;
  const current = Math.min(progress.current, duration || 0);

  const formatTime = (value) => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  if (!currentBeat) {
    return (
      <div className="bg-gray-900/60 rounded-xl p-4 border border-dashed border-white/15">
        <p className="text-sm text-gray-400">
          Elige un beat y gu�rdalo para poder controlarlo durante el round.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 rounded-xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Beat listo</p>
          <p className="text-sm font-semibold text-white">{beatName}</p>
          <p className="text-xs text-gray-400">{isPlaying ? "Reproduciendo" : "En pausa"}</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>
            {formatTime(current)} / {formatTime(duration)}
          </p>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.5}
        value={duration ? current : 0}
        onChange={(e) => onSeek(Number(e.target.value))}
        disabled={!duration}
        className="w-full accent-emerald-400"
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={onPlay}
          className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500"
        >
          Reproducir
        </button>
        <button
          type="button"
          onClick={onPause}
          className="px-3 py-2 rounded-lg border border-white/20 text-gray-100 hover:bg-white/10"
        >
          Pausa
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="px-3 py-2 rounded-lg border border-white/20 text-gray-100 hover:bg-white/10"
        >
          Reiniciar
        </button>
        <button
          type="button"
          onClick={onStop}
          className="px-3 py-2 rounded-lg border border-rose-400/40 text-rose-200 hover:bg-rose-500/10"
        >
          Detener
        </button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Volumen</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-emerald-400"
        />
      </div>
    </div>
  );
}
