// services/notificationService.js
const {
  createNotification,
  markAsRead,
  markAllAsRead,
  listNotifications,
} = require("../models/notificationModel");

let ioInstance = null;

/**
 * Permite que server.js pase su instancia de socket.io
 */
function registerSocketIO(io) {
  ioInstance = io;
}

/**
 * Envía una notificación a un usuario
 */
async function notifyUser({ userId, type, title, body, data = {} }) {
  const notification = await createNotification({
    userId,
    type,
    title,
    body,
    data,
  });

  // Emitir en tiempo real si Socket.IO está disponible
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit("notification:new", notification);
  }

  return notification;
}

/**
 * Enviar notificación masiva
 */
async function notifyUsers(userIds, { type, title, body, data = {} }) {
  const results = [];

  for (const userId of userIds) {
    const noti = await notifyUser({ userId, type, title, body, data });
    results.push(noti);
  }

  return results;
}

/**
 * Marcar 1 notificación como leída
 */
async function readNotification(notificationId) {
  return await markAsRead(notificationId);
}

/**
 * Marcar TODAS como leídas
 */
async function readAllNotifications(userId) {
  const list = await markAllAsRead(userId);

  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit("notification:read_all");
  }

  return list;
}

/**
 * Listar notificaciones del usuario
 */
async function getUserNotifications(userId, options) {
  return await listNotifications({ userId, ...options });
}

module.exports = {
  notifyUser,
  notifyUsers,
  readNotification,
  readAllNotifications,
  getUserNotifications,
  registerSocketIO,
};
