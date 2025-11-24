// controllers/achievementController.js
const achievementService = require("../services/achievementService");

/* ===========================================================
   Helper de respuesta
=========================================================== */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/* ===========================================================
   Crear logro (ADMIN)
=========================================================== */
exports.createAchievement = async (req, res) => {
  try {
    const { code, name, description, iconUrl } = req.body;

    if (!code || !name) {
      return send(res, 400, false, "code y name son obligatorios");
    }

    const achievement = await achievementService.createAchievement({
      code,
      name,
      description,
      iconUrl,
    });

    return send(res, 201, true, "Logro creado", { achievement });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   Listar logros
=========================================================== */
exports.listAchievements = async (req, res) => {
  try {
    const list = await achievementService.listAchievements();
    return send(res, 200, true, "Logros obtenidos", { achievements: list });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   Asignar logro completo al usuario
=========================================================== */
exports.unlockAchievement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { achievementId } = req.body;

    if (!achievementId) {
      return send(res, 400, false, "achievementId requerido");
    }

    const result = await achievementService.unlockAchievement({
      userId,
      achievementId,
    });

    return send(res, 200, true, "Logro desbloqueado", { result });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   Incrementar progreso logro
=========================================================== */
exports.incrementProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { achievementId, amount } = req.body;

    const result = await achievementService.incrementProgress({
      userId,
      achievementId,
      amount: amount || 1,
    });

    if (!result) {
      return send(res, 404, false, "No existe progreso de ese logro");
    }

    return send(res, 200, true, "Progreso actualizado", { result });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   Logros del usuario
=========================================================== */
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.userId;

    const list = await achievementService.getUserAchievements(userId);

    return send(res, 200, true, "Logros del usuario", { achievements: list });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};
