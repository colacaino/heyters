import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";

const initialEventForm = {
  title: "",
  opponentName: "",
  description: "",
  eventDate: "",
  entryFeeCents: 0,
  location: "",
  eventFormat: "online",
  capacity: "",
  coverUrl: "",
  streamUrl: "",
  requirements: "",
};

export default function ProfilePage() {
  const { user, initializing } = useContext(AuthContext);
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loadingAch, setLoadingAch] = useState(true);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`/achievements/user/${user.id}`);
        setAchievements(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAch(false);
      }
    };
    fetchAchievements();
  }, [user]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        setLoadingRequests(true);
        const res = await axios.get("/events/requests/mine");
        setRequests(res.data?.data?.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [user]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        setLoadingTickets(true);
        const res = await axios.get("/events/my-tickets");
        setTickets(res.data?.data?.tickets || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTickets(false);
      }
    };
    fetchTickets();
  }, [user]);

  useEffect(() => {
    if (!initializing && !user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="opacity-70">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const canRequestEvents = Boolean(user?.canRap || user?.isDemoUser);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      setRequestMessage("");
      await axios.post("/events/requests", {
        title: eventForm.title,
        opponentName: eventForm.opponentName,
        description: eventForm.description,
        eventDate: eventForm.eventDate,
        entryFeeCents: Number(eventForm.entryFeeCents) || 0,
        location: eventForm.location,
        eventFormat: eventForm.eventFormat,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
        coverUrl: eventForm.coverUrl || null,
        streamUrl: eventForm.streamUrl || null,
        requirements: eventForm.requirements || null,
      });
      setRequestMessage("Solicitud enviada correctamente. Nos pondremos en contacto pronto.");
      setEventForm({ ...initialEventForm });
      const res = await axios.get("/events/requests/mine");
      setRequests(res.data?.data?.events || []);
    } catch (err) {
      setRequestMessage(err.response?.data?.message || "No pudimos enviar tu solicitud");
    }
  };

  const renderRequests = () => {
    if (loadingRequests) {
      return <p className="text-gray-400 text-sm">Cargando...</p>;
    }
    if (requests.length === 0) {
      return <p className="text-gray-400 text-sm">A�n no has enviado solicitudes.</p>;
    }
    return (
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-black/30 border border-white/10 rounded-lg p-4 flex flex-col gap-3 text-sm"
          >
            <div className="flex items-start gap-3">
              {req.coverUrl ? (
                <img
                  src={req.coverUrl}
                  alt={req.title}
                  className="w-16 h-16 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-xs text-gray-500">
                  Sin portada
                </div>
              )}
              <div className="flex-1">
                <p className="text-base font-semibold text-white">{req.title}</p>
                <p className="text-gray-400">
                  {new Date(req.eventDate).toLocaleString()} � {req.location} � {req.eventFormat?.toUpperCase()}
                </p>
                <p className="text-gray-400">
                  Capacidad: {req.capacity || "Por confirmar"} � Entrada {req.entryFeeCents > 0 ? `$${(req.entryFeeCents / 100).toFixed(2)}` : "Gratis"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-emerald-300">
                  Estado: {req.status}
                </p>
              </div>
            </div>
            {req.adminNotes && (
              <p className="text-xs text-amber-300 border border-amber-500/30 rounded-lg p-2 bg-amber-500/10">
                Nota del staff: {req.adminNotes}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTickets = () => {
    if (loadingTickets) {
      return <p className="text-sm text-gray-400">Cargando entradas...</p>;
    }
    if (tickets.length === 0) {
      return (
        <p className="text-sm text-gray-400">
          A�n no has comprado entradas. Explora los eventos y reserva tu lugar.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-black/30 border border-white/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <p className="text-lg font-semibold text-white">{ticket.title}</p>
              <p className="text-sm text-gray-400">
                {new Date(ticket.eventDate).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">
                {ticket.pricePaidCents > 0
                  ? `$${(ticket.pricePaidCents / 100).toFixed(2)} USD`
                  : "Entrada gratuita"}
              </p>
              <p className="text-xs text-emerald-400">Acceso confirmado</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout
      title="Tu perfil"
      description="Gestiona tu identidad y coordina eventos freestyle con el staff."
    >
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Informaci�n b�sica</h2>
            <p className="text-lg"><span className="font-semibold">Nombre a mostrar: </span>{user.displayName || "-"}</p>
            <p className="text-lg"><span className="font-semibold">Username: </span>{user.username || "-"}</p>
            <p className="text-lg"><span className="font-semibold">Email: </span>{user.email || "-"}</p>
            <div className="mt-4 text-sm text-gray-400">
              <p>ID usuario: {user.id}</p>
            </div>
          </div>

          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Logros</h2>
            {loadingAch ? (
              <p className="opacity-70">Cargando logros...</p>
            ) : achievements.length === 0 ? (
              <p className="opacity-70">A�n no tienes logros desbloqueados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold">{ach.name || ach.achievement_name}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {ach.description || ach.achievement_description}
                    </p>
                    {ach.unlocked_at && (
                      <p className="text-xs text-green-400 mt-2">
                        Desbloqueado: {new Date(ach.unlocked_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {canRequestEvents && (
            <div className="bg-gray-900/70 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
              <h2 className="text-2xl font-bold text-emerald-300">Solicitar evento especial</h2>
              <p className="text-sm text-gray-300">
                Completa este formulario detallado y el equipo de Heyters aprobar� o ajustar� tu evento.
              </p>
              {requestMessage && (
                <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  {requestMessage}
                </p>
              )}
              <form onSubmit={handleEventSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="T�tulo del evento"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg p-3"
                />
                <input
                  type="text"
                  placeholder="Oponente (opcional)"
                  value={eventForm.opponentName}
                  onChange={(e) => setEventForm({ ...eventForm, opponentName: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg p-3"
                />
                <textarea
                  placeholder="Descripci�n del evento"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg p-3"
                  rows={3}
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Ubicaci�n (ciudad, venue o 'Online')"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3"
                  />
                  <select
                    value={eventForm.eventFormat}
                    onChange={(e) => setEventForm({ ...eventForm, eventFormat: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3 text-sm"
                  >
                    <option value="online">Evento online</option>
                    <option value="presencial">Evento presencial</option>
                    <option value="mixto">Formato mixto</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Capacidad estimada (personas)"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={0}
                    value={eventForm.entryFeeCents}
                    onChange={(e) => setEventForm({ ...eventForm, entryFeeCents: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3"
                    placeholder="Precio (en centavos)"
                  />
                  <input
                    type="url"
                    placeholder="URL de portada o flyer (opcional)"
                    value={eventForm.coverUrl}
                    onChange={(e) => setEventForm({ ...eventForm, coverUrl: e.target.value })}
                    className="bg-gray-800 rounded-lg p-3"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Link de streaming o ticketera (opcional)"
                  value={eventForm.streamUrl}
                  onChange={(e) => setEventForm({ ...eventForm, streamUrl: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg p-3"
                />
                <textarea
                  placeholder="Requerimientos t�cnicos o notas para el staff"
                  value={eventForm.requirements}
                  onChange={(e) => setEventForm({ ...eventForm, requirements: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg p-3"
                  rows={3}
                />
                <button className="w-full bg-emerald-500 text-black font-semibold rounded-lg py-3 hover:bg-emerald-400 transition">
                  Enviar solicitud
                </button>
              </form>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold mb-2">Tus solicitudes</h3>
                {renderRequests()}
              </div>
            </div>
          )}
        </div>

        <aside className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold">Checklist del anfitri�n</h3>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
            <li>Verifica tu conexi�n y dispositivos antes de iniciar una batalla.</li>
            <li>Revisa notificaciones para aceptar invitaciones o avisos del staff.</li>
            <li>Comparte tu perfil con la comunidad para ganar seguimiento.</li>
          </ul>

          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Tus entradas confirmadas</h2>
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="text-sm text-emerald-300 hover:text-emerald-200 underline"
              >
                Ver pr�ximos eventos
              </button>
            </div>
            {renderTickets()}
          </div>
        </aside>
      </div>
    </Layout>
  );
}





