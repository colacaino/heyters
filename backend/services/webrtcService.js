const battleService = require("./battleService");
let ioRef = null;

function registerSocket(io) {
  ioRef = io;
}

function setupBattleSignaling() {
  if (!ioRef) throw new Error("Socket.IO no inicializado");

  ioRef.on("connection", (socket) => {
    socket.on("battle:join", ({ battleId, userId }) => {
      const room = `battle_${battleId}`;
      socket.join(room);

      ioRef.to(room).emit("battle:user_joined", {
        userId,
        socketId: socket.id,
      });

      battleService
        .getBattleState(battleId)
        .then((state) => {
          if (state) {
            socket.emit("battle:update_state", { battleId, state });
          } else {
            socket.emit("battle:not_found", { battleId });
          }
        })
        .catch((err) => {
          console.error(
            `[Battle] Error enviando estado inicial (battleId=${battleId}):`,
            err.message
          );
        });
    });

    // Chat en vivo
    socket.on("battle:send_chat", ({ battleId, userId, username, message }) => {
      if (!battleId || !message) return;

      const room = `battle_${battleId}`;
      const chatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        battleId,
        userId,
        username: username || `User ${userId}`,
        message: message.slice(0, 200), // Limitar a 200 caracteres
        timestamp: new Date().toISOString(),
      };

      // Emitir a todos en la sala incluyendo el remitente
      ioRef.to(room).emit("battle:chat_message", chatMessage);
    });

    socket.on("battle:device_control", async (payload = {}, callback) => {
      try {
        const { battleId, userId } = payload;
        await battleService.controlParticipantMedia(battleId, userId, payload);
        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        console.error("[Battle] Error al controlar dispositivos:", err);
        if (typeof callback === "function") {
          callback({ success: false, message: err.message });
        }
      }
    });
  });
}

module.exports = {
  registerSocket,
  setupBattleSignaling,
};
