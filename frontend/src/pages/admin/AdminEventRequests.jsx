import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { AuthContext } from "../../context/AuthContext";

const formatCurrency = (value = 0) => {
  if (!value || Number(value) === 0) return "Entrada gratuita";
  return `$${Number(value).toLocaleString("es-CL")} CLP`;
};

// Obtener fecha mínima (hoy)
const getMinDate = () => {
  const today = new Date();
  return today.toISOString().slice(0, 16);
};

const EVENT_FORMATS = [
  { value: "online", label: "Evento online" },
  { value: "presencial", label: "Evento presencial" },
  { value: "mixto", label: "Formato mixto" },
];

const defaultEditForm = {
  title: "",
  opponentName: "",
  description: "",
  eventDate: "",
  entryFee: 0, // En pesos CLP directamente
  commissionPercent: 20,
  location: "Online",
  eventFormat: "online",
  capacity: "",
  streamUrl: "", // Link para ver el evento (YouTube, Twitch, etc.)
  requirements: "",
  adminNotes: "",
  status: "pending",
};

export default function AdminEventRequests() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/home");
    }
  }, [user, navigate]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/event-requests");
      setEvents(res.data?.data?.events || []);
    } catch (err) {
      toast.error("No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (eventId, status) => {
    try {
      await axios.patch(`/admin/event-requests/${eventId}`, { status });
      toast.success("Solicitud actualizada");
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al actualizar");
    }
  };

  const openEditor = (event) => {
    setEditingEvent(event);
    // Convertir de centavos a pesos si viene del backend en centavos
    const entryFee = event.entryFeeCents ? Math.round(event.entryFeeCents / 100) : (event.entryFee || 0);
    setEditForm({
      title: event.title || "",
      opponentName: event.opponentName || "",
      description: event.description || "",
      eventDate: event.eventDate ? event.eventDate.slice(0, 16) : "",
      entryFee: entryFee,
      commissionPercent: event.commissionPercent || 20,
      location: event.location || (event.eventFormat === "online" ? "Online" : ""),
      eventFormat: event.eventFormat || "online",
      capacity: event.capacity || "",
      streamUrl: event.streamUrl || "",
      requirements: event.requirements || "",
      adminNotes: event.adminNotes || "",
      status: event.status || "pending",
    });
  };

  const closeEditor = () => {
    setEditingEvent(null);
    setEditForm(defaultEditForm);
    setSaving(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    // Validar fecha no sea pasada
    const selectedDate = new Date(editForm.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error("La fecha del evento no puede ser anterior a hoy");
      return;
    }

    try {
      setSaving(true);
      await axios.patch(`/admin/event-requests/${editingEvent.id}`, {
        ...editForm,
        // Convertir pesos a centavos para el backend
        entryFeeCents: Math.round(Number(editForm.entryFee) * 100) || 0,
        commissionPercent: Number(editForm.commissionPercent) || 0,
        capacity: editForm.capacity ? Number(editForm.capacity) : null,
        // Si es online, la ubicacion es "Online"
        location: editForm.eventFormat === "online" ? "Online" : editForm.location,
      });
      toast.success("Evento actualizado");
      closeEditor();
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title="Solicitudes de eventos"
      description="Gestiona pedidos Pro, asigna precios y prepara la informaci�n para producci�n."
    >
      {loading ? (
        <p className="opacity-70">Cargando...</p>
      ) : events.length === 0 ? (
        <p className="opacity-70">No hay solicitudes pendientes.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-900/70 border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {event.coverUrl && (
                  <img
                    src={event.coverUrl}
                    alt={event.title}
                    className="w-full lg:w-48 h-48 object-cover rounded-xl border border-white/10"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold">{event.title}</p>
                    <span
                      className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full ${
                        event.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : event.status === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Solicitado por #{event.requesterId} � {new Date(event.eventDate).toLocaleString()}
                  </p>
                  <p className="text-gray-300 text-sm">{event.description}</p>
                  <p className="text-sm text-gray-400">
                    Ubicaci�n: {event.location} � Formato: {event.eventFormat}
                  </p>
                  <p className="text-sm text-gray-400">
                    Capacidad: {event.capacity || "Por confirmar"} � {formatCurrency(event.entryFeeCents)}
                  </p>
                  {event.streamUrl && (
                    <a
                      href={event.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-purple-300 underline"
                    >
                      Link de streaming / ticketera
                    </a>
                  )}
                  {event.requirements && (
                    <p className="text-xs text-gray-500 border border-dashed border-white/20 rounded-lg p-2">
                      Requerimientos: {event.requirements}
                    </p>
                  )}
                  {event.adminNotes && (
                    <p className="text-xs text-amber-300 border border-amber-500/30 rounded-lg p-2 bg-amber-500/10">
                      Nota al MC: {event.adminNotes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateStatus(event.id, "approved")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => updateStatus(event.id, "rejected")}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => openEditor(event)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Editar detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Editar evento</h2>
                <p className="text-sm text-gray-400">Solicitud #{editingEvent.id}</p>
              </div>
              <button
                onClick={closeEditor}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleSave}>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Titulo del evento</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 rounded-lg p-3"
                    placeholder="Ej: Red Bull Batalla"
                    value={editForm.title}
                    onChange={(e) => handleEditChange("title", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Oponente (opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 rounded-lg p-3"
                    placeholder="Nombre del rival"
                    value={editForm.opponentName}
                    onChange={(e) => handleEditChange("opponentName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Descripcion</label>
                <textarea
                  className="w-full bg-gray-800 rounded-lg p-3"
                  rows={2}
                  placeholder="Describe el evento..."
                  value={editForm.description}
                  onChange={(e) => handleEditChange("description", e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha y hora</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-800 rounded-lg p-3"
                    value={editForm.eventDate}
                    min={getMinDate()}
                    onChange={(e) => handleEditChange("eventDate", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Formato</label>
                  <select
                    className="w-full bg-gray-800 rounded-lg p-3"
                    value={editForm.eventFormat}
                    onChange={(e) => {
                      handleEditChange("eventFormat", e.target.value);
                      if (e.target.value === "online") {
                        handleEditChange("location", "Online");
                      }
                    }}
                  >
                    {EVENT_FORMATS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ubicacion solo si NO es online */}
              {editForm.eventFormat !== "online" && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Ubicacion del evento</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 rounded-lg p-3"
                    placeholder="Ej: Teatro Caupolican, Santiago"
                    value={editForm.location}
                    onChange={(e) => handleEditChange("location", e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Precio entrada (CLP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      className="w-full bg-gray-800 rounded-lg p-3 pl-7"
                      placeholder="0 = gratis"
                      value={editForm.entryFee}
                      onChange={(e) => handleEditChange("entryFee", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Number(editForm.entryFee) === 0 ? "Entrada gratuita" : `$${Number(editForm.entryFee).toLocaleString("es-CL")} CLP`}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Comision plataforma (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full bg-gray-800 rounded-lg p-3"
                    value={editForm.commissionPercent}
                    onChange={(e) => handleEditChange("commissionPercent", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Capacidad maxima (opcional)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-gray-800 rounded-lg p-3"
                  placeholder="Sin limite"
                  value={editForm.capacity}
                  onChange={(e) => handleEditChange("capacity", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Link de transmision (opcional)</label>
                <input
                  type="url"
                  className="w-full bg-gray-800 rounded-lg p-3"
                  placeholder="https://youtube.com/... o https://twitch.tv/..."
                  value={editForm.streamUrl}
                  onChange={(e) => handleEditChange("streamUrl", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Link donde se transmitira el evento</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas internas (produccion)</label>
                <textarea
                  className="w-full bg-gray-800 rounded-lg p-3"
                  rows={2}
                  placeholder="Notas para el equipo de produccion..."
                  value={editForm.requirements}
                  onChange={(e) => handleEditChange("requirements", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mensaje para el MC</label>
                <textarea
                  className="w-full bg-gray-800 rounded-lg p-3"
                  rows={2}
                  placeholder="Este mensaje sera visible para el rapero..."
                  value={editForm.adminNotes}
                  onChange={(e) => handleEditChange("adminNotes", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Estado</label>
                <select
                  className="w-full bg-gray-800 rounded-lg p-3"
                  value={editForm.status}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-4 py-2 rounded-lg border border-white/20 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}


