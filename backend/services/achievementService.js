// services/achievementService.js
const {
  createAchievement: createAchievementModel,
  getAchievementByCode,
  listAchievements: listAchievementsModel,
  unlockAchievement: unlockAchievementModel,
  incrementProgress: incrementProgressModel,
  getUserAchievements: getUserAchievementsModel,
} = require("../models/achievementModel");

/* ============================================================
   CREAR LOGRO (ADMIN)
============================================================ */
async function createAchievement({ code, name, description, iconUrl }) {
  const existing = await getAchievementByCode(code);
  if (existing) {
    throw new Error("Ya existe un logro con ese code");
  }

  return await createAchievementModel({
    code,
    name,
    description,
    iconUrl,
  });
}

/* ============================================================
   LISTAR LOGROS
============================================================ */
async function listAchievements() {
  return await listAchievementsModel();
}

/* ============================================================
   DESBLOQUEAR LOGRO
============================================================ */
async function unlockAchievement({ userId, achievementId }) {
  return await unlockAchievementModel({
    userId,
    achievementId,
  });
}

/* ============================================================
   INCREMENTAR PROGRESO
============================================================ */
async function incrementProgress({ userId, achievementId, amount }) {
  return await incrementProgressModel({
    userId,
    achievementId,
    amount,
  });
}

/* ============================================================
   LOGROS DEL USUARIO
============================================================ */
async function getUserAchievements(userId) {
  return await getUserAchievementsModel(userId);
}

module.exports = {
  createAchievement,
  listAchievements,
  unlockAchievement,
  incrementProgress,
  getUserAchievements,
};
