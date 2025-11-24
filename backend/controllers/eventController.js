const {
  createEventRequest,
  listApprovedEvents,
  listEventRequests,
  getEventRequestById,
  updateEventRequest,
  createEventTicket,
  hasTicket,
  listTicketsByUser,
} = require("../models/eventModel");
const { findUserById } = require("../models/userModel");
const { logger } = require("../utils/logger");

function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

exports.requestEvent = async (req, res) => {
  try {
    const {
      title,
      opponentName,
      description,
      eventDate,
      entryFeeCents = 0,
      location,
      eventFormat = "online",
      capacity = null,
      coverUrl = null,
      streamUrl = null,
      requirements = null,
    } = req.body;
    const user = await findUserById(req.userId);
    if (!user) return send(res, 401, false, "Usuario no encontrado");

    if (!user.canRap && !user.isDemoUser) {
      return send(res, 403, false, "Tu plan no permite solicitar eventos");
    }

    const event = await createEventRequest({
      requesterId: req.userId,
      title,
      opponentName,
      description,
      eventDate,
      entryFeeCents,
      commissionPercent: 20,
      location,
      eventFormat,
      capacity,
      coverUrl,
      streamUrl,
      requirements,
    });

    logger.info("Solicitud de evento creada", {
      eventId: event.id,
      requesterId: req.userId,
    });

    return send(res, 201, true, "Solicitud enviada", { event });
  } catch (error) {
    logger.error("Error en requestEvent:", error);
    return send(res, 500, false, "No se pudo crear la solicitud");
  }
};

exports.listMyRequests = async (req, res) => {
  try {
    const events = await listEventRequests({ requesterId: req.userId });
    return send(res, 200, true, "Solicitudes", { events });
  } catch (error) {
    logger.error("Error en listMyRequests:", error);
    return send(res, 500, false, "No se pudieron obtener tus solicitudes");
  }
};

exports.listUpcomingEvents = async (req, res) => {
  try {
    const events = await listApprovedEvents();
    return send(res, 200, true, "Eventos disponibles", { events });
  } catch (error) {
    logger.error("Error en listUpcomingEvents:", error);
    return send(res, 500, false, "No se pudieron listar eventos");
  }
};

exports.purchaseTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await getEventRequestById(eventId);

    if (!event || event.status !== "approved") {
      return send(res, 404, false, "Evento no disponible");
    }

    const already = await hasTicket(eventId, req.userId);
    if (already) {
      return send(res, 200, true, "Ya tienes tu acceso", { ticket: null });
    }

    const ticket = await createEventTicket({
      eventId,
      userId: req.userId,
      pricePaidCents: event.entryFeeCents,
    });

    return send(res, 200, true, "Entrada registrada", { ticket });
  } catch (error) {
    logger.error("Error en purchaseTicket:", error);
    return send(res, 500, false, "No se pudo registrar la compra");
  }
};

exports.listMyTickets = async (req, res) => {
  try {
    const tickets = await listTicketsByUser(req.userId);
    return send(res, 200, true, "Tus entradas", { tickets });
  } catch (error) {
    logger.error("Error en listMyTickets:", error);
    return send(res, 500, false, "No se pudieron obtener tus entradas");
  }
};
