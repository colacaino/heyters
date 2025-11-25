// controllers/adminController.js
const db = require("../db");
const bcrypt = require("bcryptjs");
const {
  createUser,
  findUserById,
  listUsers,
  updateUser,
  updateUserProStatus,
  deleteUser,
} = require("../models/userModel");
const {
  listEventRequests,
  getEventRequestById,
  updateEventRequest,
} = require("../models/eventModel");
const { logger } = require("../utils/logger");

/**
 * Helper para respuestas
 */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/**
 * GET /api/admin/dashboard
 * Obtiene estadísticas generales para el dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Total de usuarios
    const totalUsersResult = await db.query("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Usuarios Pro
    const proUsersResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE is_pro = TRUE OR role = 'pro' OR role = 'admin'"
    );
    const proUsers = parseInt(proUsersResult.rows[0].count);

    // Usuarios nuevos hoy
    const newTodayResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURRENT_DATE"
    );
    const newToday = parseInt(newTodayResult.rows[0].count);

    // Usuarios nuevos esta semana
    const newWeekResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const newWeek = parseInt(newWeekResult.rows[0].count);

    // Total de batallas
    const totalBattlesResult = await db.query("SELECT COUNT(*) as count FROM battles");
    const totalBattles = parseInt(totalBattlesResult.rows[0].count);

    // Batallas activas
    const activeBattlesResult = await db.query(
      "SELECT COUNT(*) as count FROM battles WHERE status = 'live'"
    );
    const activeBattles = parseInt(activeBattlesResult.rows[0].count);

    // Batallas hoy
    const battlesTodayResult = await db.query(
      "SELECT COUNT(*) as count FROM battles WHERE DATE(created_at) = CURRENT_DATE"
    );
    const battlesToday = parseInt(battlesTodayResult.rows[0].count);

    // Tasa de conversión (Pro / Total * 100)
    const conversionRate = totalUsers > 0
      ? ((proUsers / totalUsers) * 100).toFixed(1)
      : 0;

    // Usuarios recientes (últimos 5)
    const recentUsersResult = await db.query(
      `SELECT id, username, display_name, email, role, is_pro, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Batallas recientes (últimas 5)
    const recentBattlesResult = await db.query(
      `SELECT b.id, b.title, b.status, b.created_at, u.username as creator
       FROM battles b
       JOIN users u ON b.created_by = u.id
       ORDER BY b.created_at DESC
       LIMIT 5`
    );

    return send(res, 200, true, "Dashboard obtenido", {
      stats: {
        totalUsers,
        proUsers,
        basicUsers: totalUsers - proUsers,
        newToday,
        newWeek,
        totalBattles,
        activeBattles,
        battlesToday,
        conversionRate: parseFloat(conversionRate),
      },
      recentUsers: recentUsersResult.rows.map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        email: row.email,
        role: row.role,
        isPro: row.is_pro,
        createdAt: row.created_at,
      })),
      recentBattles: recentBattlesResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        status: row.status,
        creator: row.creator,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    logger.error("Error en getDashboard:", error);
    return send(res, 500, false, "Error al obtener dashboard");
  }
};

/**
 * GET /api/admin/users
 * Lista todos los usuarios con paginación y filtros
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isPro } = req.query;

    // Construir filtro
    let roleFilter = role;
    if (isPro === 'true') {
      roleFilter = 'pro';
    } else if (isPro === 'false') {
      roleFilter = 'basic';
    }

    const result = await listUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role: roleFilter,
    });

    // Transformar para que el frontend reciba { users: [...], pagination: {...} }
    return send(res, 200, true, "Usuarios obtenidos", {
      users: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error("Error en getUsers:", error);
    return send(res, 500, false, "Error al obtener usuarios");
  }
};

/**
 * GET /api/admin/users/:id
 * Obtiene un usuario específico
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    return send(res, 200, true, "Usuario obtenido", { user });
  } catch (error) {
    logger.error("Error en getUserById:", error);
    return send(res, 500, false, "Error al obtener usuario");
  }
};

/**
 * POST /api/admin/users
 * Crea un nuevo usuario desde el admin panel
 */
exports.createUserAdmin = async (req, res) => {
  try {
    const { username, displayName, email, password, isPro = false } = req.body;

    if (!username || !email || !password) {
      return send(res, 400, false, "Username, email y password son requeridos");
    }

    // Verificar si ya existe
    const existingEmail = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return send(res, 400, false, "El email ya está registrado");
    }

    const existingUsername = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (existingUsername.rows.length > 0) {
      return send(res, 400, false, "El username ya existe");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser({
      username,
      displayName: displayName || username,
      email,
      passwordHash,
      role: isPro ? 'pro' : 'basic',
      isPro,
    });

    logger.auth(user.id, "user_created_by_admin", {
      adminId: req.userId,
      username: user.username,
    });

    return send(res, 201, true, "Usuario creado exitosamente", { user });
  } catch (error) {
    logger.error("Error en createUserAdmin:", error);
    return send(res, 500, false, "Error al crear usuario");
  }
};

/**
 * PUT /api/admin/users/:id
 * Actualiza un usuario
 */
exports.updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, email, bio, isPro, isActive, role } = req.body;

    const user = await findUserById(id);
    if (!user) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    // Actualizar campos básicos
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    let updatedUser = await updateUser(id, updateData);

    // Si se cambia el estado Pro
    if (isPro !== undefined) {
      updatedUser = await updateUserProStatus(id, isPro);
    }

    logger.auth(id, "user_updated_by_admin", {
      adminId: req.userId,
      changes: req.body,
    });

    return send(res, 200, true, "Usuario actualizado", { user: updatedUser });
  } catch (error) {
    logger.error("Error en updateUserAdmin:", error);
    return send(res, 500, false, "Error al actualizar usuario");
  }
};

/**
 * DELETE /api/admin/users/:id
 * Elimina (desactiva) un usuario
 */
exports.deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    // No permitir eliminar admins
    if (user.isAdmin) {
      return send(res, 403, false, "No se puede eliminar un administrador");
    }

    await deleteUser(id);

    logger.auth(id, "user_deleted_by_admin", {
      adminId: req.userId,
      username: user.username,
    });

    return send(res, 200, true, "Usuario eliminado");
  } catch (error) {
    logger.error("Error en deleteUserAdmin:", error);
    return send(res, 500, false, "Error al eliminar usuario");
  }
};

/**
 * PUT /api/admin/users/:id/toggle-pro
 * Activa o desactiva el estado Pro de un usuario
 */
exports.toggleUserPro = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPro, expiresAt } = req.body;

    const user = await findUserById(id);
    if (!user) {
      return send(res, 404, false, "Usuario no encontrado");
    }

    const updatedUser = await updateUserProStatus(id, isPro, expiresAt);

    logger.auth(id, isPro ? "user_upgraded_to_pro" : "user_downgraded_to_basic", {
      adminId: req.userId,
      username: user.username,
    });

    return send(res, 200, true, `Usuario ${isPro ? 'actualizado a Pro' : 'cambiado a Básico'}`, {
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Error en toggleUserPro:", error);
    return send(res, 500, false, "Error al cambiar estado Pro");
  }
};

/**
 * GET /api/admin/event-requests
 */
exports.getEventRequestsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const events = await listEventRequests({ status });
    return send(res, 200, true, "Solicitudes de eventos", { events });
  } catch (error) {
    logger.error("Error en getEventRequestsAdmin:", error);
    return send(res, 500, false, "Error al obtener solicitudes");
  }
};

/**
 * PATCH /api/admin/event-requests/:id
 */
exports.updateEventRequestAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, entryFeeCents, commissionPercent, eventDate } = req.body;

    const event = await getEventRequestById(id);
    if (!event) {
      return send(res, 404, false, "Solicitud no encontrada");
    }

    const payload = {};
    if (status !== undefined) payload.status = status;
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    if (entryFeeCents !== undefined) payload.entryFeeCents = entryFeeCents;
    if (commissionPercent !== undefined) payload.commissionPercent = commissionPercent;
    if (eventDate !== undefined) payload.eventDate = eventDate;

    const updated = await updateEventRequest(id, payload);

    logger.info("Solicitud de evento actualizada", {
      eventRequestId: id,
      adminId: req.userId,
      status: payload.status ?? event.status,
    });

    return send(res, 200, true, "Solicitud actualizada", { event: updated });
  } catch (error) {
    logger.error("Error en updateEventRequestAdmin:", error);
    return send(res, 500, false, "Error al actualizar solicitud");
  }
};

/**
 * GET /api/admin/stats/growth
 * Obtiene estadísticas de crecimiento por día/semana/mes
 */
exports.getGrowthStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // días

    // Usuarios por día
    const userGrowth = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Batallas por día
    const battleGrowth = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM battles
       WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    return send(res, 200, true, "Estadísticas de crecimiento", {
      userGrowth: userGrowth.rows,
      battleGrowth: battleGrowth.rows,
    });
  } catch (error) {
    logger.error("Error en getGrowthStats:", error);
    return send(res, 500, false, "Error al obtener estadísticas");
  }
};

/**
 * GET /api/admin/report/pdf
 * Genera y descarga un informe de gestión en PDF
 */
exports.generateManagementReport = async (req, res) => {
  try {
    const reportService = require("../services/reportService");
    const pdfBuffer = await reportService.generateManagementReport();

    const filename = `Heyters_Informe_${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    logger.info("Informe PDF generado", {
      adminId: req.userId,
      filename,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error("Error generando informe PDF:", error);
    return send(res, 500, false, "Error al generar el informe PDF");
  }
};
