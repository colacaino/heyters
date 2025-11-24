// controllers/notificationController.js
const notificationService = require("../services/notificationService");

/* ===========================================================
   Helper respuesta
=========================================================== */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/* ===========================================================
   Listar notificaciones del usuario
=========================================================== */
exports.listNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const list = await notificationService.getUserNotifications(userId, {
      onlyUnread: req.query.onlyUnread === "true",
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    });

    return send(res, 200, true, "Notificaciones obtenidas", { notifications: list });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   Marcar UNA como leída
=========================================================== */
exports.readOne = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const noti = await notificationService.readNotification(notificationId);

    return send(res, 200, true, "Notificación marcada como leída", { notification: noti });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   Marcar TODAS como leídas
=========================================================== */
exports.readAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const list = await notificationService.readAllNotifications(userId);

    return send(res, 200, true, "Todas las notificaciones marcadas como leídas", {
      notifications: list,
    });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   ENVIAR notificación manual (admin)
=========================================================== */
exports.sendNotification = async (req, res) => {
  try {
    const { userId, type, title, body, data } = req.body;

    if (!userId || !type || !title || !body) {
      return send(res, 400, false, "Campos obligatorios: userId, type, title, body");
    }

    const noti = await notificationService.notifyUser({
      userId,
      type,
      title,
      body,
      data,
    });

    return send(res, 201, true, "Notificación enviada", { notification: noti });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   Envío masivo (ADMIN)
=========================================================== */
exports.sendNotificationToMany = async (req, res) => {
  try {
    const { users, type, title, body, data } = req.body;

    if (!users || !Array.isArray(users)) {
      return send(res, 400, false, "El campo 'users' debe ser un array");
    }

    const notis = await notificationService.notifyUsers(users, {
      type,
      title,
      body,
      data,
    });

    return send(res, 201, true, "Notificaciones enviadas", { notifications: notis });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};
