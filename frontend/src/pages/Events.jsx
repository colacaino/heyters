import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function EventsPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownedTickets, setOwnedTickets] = useState(new Set());
  const [loadingTickets, setLoadingTickets] = useState(false);
  const loadTickets = useCallback(async () => {
    if (!user) {
      setOwnedTickets(new Set());
      return;
    }
    try {
      setLoadingTickets(true);
      const res = await axios.get("/events/my-tickets");
      const ids = new Set((res.data?.data?.tickets || []).map((ticket) => Number(ticket.eventId)));
      setOwnedTickets(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/events/upcoming");
        setEvents(res.data?.data?.events || []);
      } catch (err) {
        toast.error("No se pudieron cargar los eventos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handlePurchase = async (eventId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await axios.post(`/events/${eventId}/purchase`);
      toast.success("Entrada registrada");
      await loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo registrar tu entrada");
    }
  };

  return (
    <Layout
      title="Eventos especiales"
      description="Explora shows exclusivos organizados por la comunidad. Compra tu entrada y vive el freestyle premium."
    >
      {loading ? (
        <p className="opacity-70">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <p className="opacity-70">No hay eventos programados por ahora.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const hasTicket = ownedTickets.has(Number(event.id));
            return (
              <div
                key={event.id}
                className="bg-gray-900/70 border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {event.coverUrl && (
                    <img
                      src={event.coverUrl}
                      alt={event.title}
                      className="w-full md:w-48 h-48 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold">{event.title}</p>
                      <span className="text-xs uppercase tracking-wide text-emerald-300">
                        {event.eventFormat}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{event.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.eventDate).toLocaleString()} · {event.location}
                    </p>
                    {event.opponentName && (
                      <p className="text-sm text-gray-400">Vs {event.opponentName}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      Capacidad: {event.capacity || 'Por confirmar'} · Host: {event.requesterName}
                    </p>
                    {event.requirements && (
                      <p className="text-xs text-gray-500 border border-dashed border-white/10 rounded-lg p-2">
                        Notas: {event.requirements}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {event.entryFeeCents > 0
                        ? `$${(event.entryFeeCents / 100).toFixed(2)} USD`
                        : 'Entrada gratuita'}
                    </p>
                    {event.streamUrl && (
                      <a
                        href={event.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-purple-300 underline"
                      >
                        Ver detalles del streaming / ticketera
                      </a>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <button
                      onClick={() => handlePurchase(event.id)}
                      disabled={hasTicket}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        hasTicket
                          ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500'
                      }`}
                    >
                      {hasTicket
                        ? 'Entrada confirmada'
                        : event.entryFeeCents > 0
                        ? 'Comprar entrada'
                        : 'Reservar lugar'}
                    </button>
                    {hasTicket && (
                      <p className="text-xs text-green-400 uppercase tracking-wide">
                        Ya tienes acceso
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

