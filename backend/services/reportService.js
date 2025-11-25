// services/reportService.js
const PDFDocument = require("pdfkit");
const db = require("../db");

/**
 * Genera un informe de gestión completo en PDF
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateManagementReport() {
  // Obtener todas las estadísticas necesarias
  const stats = await getReportStatistics();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // ====================================
      // ENCABEZADO
      // ====================================
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("HEYTERS", { align: "center" })
        .fontSize(16)
        .text("Informe de Gestión de Plataforma", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Fecha de generación: ${new Date().toLocaleDateString("es-CL")}`, {
          align: "center",
        })
        .text(`Hora: ${new Date().toLocaleTimeString("es-CL")}`, { align: "center" })
        .moveDown(2);

      // ====================================
      // RESUMEN EJECUTIVO
      // ====================================
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text("RESUMEN EJECUTIVO")
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000")
        .text(`Total de Usuarios Registrados: ${stats.totalUsers}`, { indent: 20 })
        .text(`Usuarios Pro Activos: ${stats.proUsers}`, { indent: 20 })
        .text(`Usuarios Básicos: ${stats.basicUsers}`, { indent: 20 })
        .text(`Tasa de Conversión a Pro: ${stats.conversionRate}%`, { indent: 20 })
        .text(`Total de Batallas Creadas: ${stats.totalBattles}`, { indent: 20 })
        .text(`Batallas Activas: ${stats.activeBattles}`, { indent: 20 })
        .text(`Ingresos Totales: ${formatCurrency(stats.totalRevenueCents)}`, { indent: 20 })
        .text(`Pagos Procesados: ${stats.totalPayments}`, { indent: 20 })
        .moveDown(2);

      // ====================================
      // USUARIOS
      // ====================================
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text("USUARIOS")
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000")
        .text("Distribución por Tipo de Cuenta:", { indent: 20 })
        .moveDown(0.3);

      // Tabla de usuarios
      const userTableY = doc.y;
      doc
        .font("Helvetica-Bold")
        .text("Tipo", 70, userTableY, { width: 150, continued: true })
        .text("Cantidad", { width: 100, continued: true })
        .text("Porcentaje", { width: 100 })
        .moveDown(0.3);

      doc.font("Helvetica");
      const proPercentage = stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : 0;
      const basicPercentage = stats.totalUsers > 0 ? ((stats.basicUsers / stats.totalUsers) * 100).toFixed(1) : 0;

      doc
        .text("Pro", 70, doc.y, { width: 150, continued: true })
        .text(stats.proUsers.toString(), { width: 100, continued: true })
        .text(`${proPercentage}%`, { width: 100 })
        .moveDown(0.2);

      doc
        .text("Básico", 70, doc.y, { width: 150, continued: true })
        .text(stats.basicUsers.toString(), { width: 100, continued: true })
        .text(`${basicPercentage}%`, { width: 100 })
        .moveDown(0.2);

      doc
        .font("Helvetica-Bold")
        .text("Total", 70, doc.y, { width: 150, continued: true })
        .text(stats.totalUsers.toString(), { width: 100, continued: true })
        .text("100%", { width: 100 })
        .moveDown(1.5);

      // Nuevos usuarios
      doc
        .font("Helvetica")
        .text("Nuevos Registros:", { indent: 20 })
        .text(`Hoy: ${stats.newToday} usuarios`, { indent: 40 })
        .text(`Última semana: ${stats.newWeek} usuarios`, { indent: 40 })
        .text(`Último mes: ${stats.newMonth} usuarios`, { indent: 40 })
        .moveDown(2);

      // ====================================
      // BATALLAS
      // ====================================
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text("BATALLAS")
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000")
        .text("Estado de las Batallas:", { indent: 20 })
        .moveDown(0.3);

      const battleTableY = doc.y;
      doc
        .font("Helvetica-Bold")
        .text("Estado", 70, battleTableY, { width: 150, continued: true })
        .text("Cantidad", { width: 100 })
        .moveDown(0.3);

      doc
        .font("Helvetica")
        .text("Activas", 70, doc.y, { width: 150, continued: true })
        .text(stats.activeBattles.toString(), { width: 100 })
        .moveDown(0.2);

      doc
        .text("Finalizadas", 70, doc.y, { width: 150, continued: true })
        .text(stats.finishedBattles.toString(), { width: 100 })
        .moveDown(0.2);

      doc
        .font("Helvetica-Bold")
        .text("Total", 70, doc.y, { width: 150, continued: true })
        .text(stats.totalBattles.toString(), { width: 100 })
        .moveDown(1.5);

      doc
        .font("Helvetica")
        .text(`Batallas creadas hoy: ${stats.battlesToday}`, { indent: 40 })
        .text(`Promedio de rounds por batalla: ${stats.avgRounds}`, { indent: 40 })
        .moveDown(2);

      // ====================================
      // SUSCRIPCIONES Y PAGOS
      // ====================================
      if (doc.y > 600) {
        doc.addPage();
      }

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text("SUSCRIPCIONES Y PAGOS")
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000")
        .text("Resumen Financiero:", { indent: 20 })
        .moveDown(0.3);

      doc
        .text(`Ingresos Totales: ${formatCurrency(stats.totalRevenueCents)}`, { indent: 40 })
        .text(`Pagos Exitosos: ${stats.totalPayments}`, { indent: 40 })
        .text(`Promedio por Pago: ${formatCurrency(Math.round(stats.totalRevenueCents / (stats.totalPayments || 1)))}`, { indent: 40 })
        .text(`Suscripciones Activas: ${stats.activeSubscriptions}`, { indent: 40 })
        .text(`Usuarios Pagantes Únicos: ${stats.uniquePayingUsers}`, { indent: 40 })
        .moveDown(2);

      // Ingresos mensuales
      if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Ingresos por Mes:", { indent: 20 })
          .moveDown(0.5);

        const monthTableY = doc.y;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Mes", 70, monthTableY, { width: 150, continued: true })
          .text("Pagos", { width: 100, continued: true })
          .text("Ingresos", { width: 150 })
          .moveDown(0.3);

        doc.font("Helvetica");
        stats.monthlyRevenue.slice(0, 6).forEach((month) => {
          doc
            .text(month.month, 70, doc.y, { width: 150, continued: true })
            .text(month.payments.toString(), { width: 100, continued: true })
            .text(formatCurrency(month.revenue_cents), { width: 150 })
            .moveDown(0.2);
        });
      }

      doc.moveDown(2);

      // ====================================
      // USUARIOS RECIENTES
      // ====================================
      if (doc.y > 650) {
        doc.addPage();
      }

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text("USUARIOS RECIENTES (Últimos 10)")
        .moveDown(0.5);

      if (stats.recentUsers && stats.recentUsers.length > 0) {
        const userListY = doc.y;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Usuario", 70, userListY, { width: 150, continued: true })
          .text("Email", { width: 150, continued: true })
          .text("Tipo", { width: 80 })
          .moveDown(0.3);

        doc.font("Helvetica");
        stats.recentUsers.slice(0, 10).forEach((user) => {
          const currentY = doc.y;
          if (currentY > 700) {
            doc.addPage();
          }
          doc
            .text(user.display_name || user.username, 70, doc.y, { width: 150, continued: true })
            .text(user.email, { width: 150, continued: true })
            .text(user.is_pro ? "Pro" : "Básico", { width: 80 })
            .moveDown(0.2);
        });
      }

      doc.moveDown(2);

      // ====================================
      // PIE DE PÁGINA
      // ====================================
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#666666")
        .text(
          "Este informe fue generado automáticamente por el sistema de gestión de Heyters.",
          50,
          750,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtiene todas las estadísticas necesarias para el informe
 */
async function getReportStatistics() {
  try {
    // Estadísticas de usuarios
    const userStats = await db.query(`
      SELECT
        COALESCE(COUNT(*), 0) as total_users,
        COALESCE(COUNT(*) FILTER (WHERE is_pro = true), 0) as pro_users,
        COALESCE(COUNT(*) FILTER (WHERE is_pro = false), 0) as basic_users,
        COALESCE(COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as new_today,
        COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0) as new_week,
        COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) as new_month
      FROM users
    `);

    const users = userStats.rows[0] || {};
    const totalUsers = parseInt(users.total_users) || 0;
    const proUsers = parseInt(users.pro_users) || 0;
    const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0;

  // Estadísticas de batallas
  const battleStats = await db.query(`
    SELECT
      COUNT(*) as total_battles,
      COUNT(*) FILTER (WHERE status = 'live') as active_battles,
      COUNT(*) FILTER (WHERE status = 'finished') as finished_battles,
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as battles_today,
      ROUND(AVG(rounds), 1) as avg_rounds
    FROM battles
  `);

  const battles = battleStats.rows[0];

  // Estadísticas de pagos
  const paymentStats = await db.query(`
    SELECT
      COUNT(*) as total_payments,
      COALESCE(SUM(amount_cents), 0) as total_revenue_cents,
      COUNT(DISTINCT user_id) as unique_paying_users
    FROM payments
    WHERE status = 'succeeded'
  `);

  const payments = paymentStats.rows[0];

  // Suscripciones activas
  const subscriptionStats = await db.query(`
    SELECT COUNT(*) as active_subscriptions
    FROM subscriptions
    WHERE status = 'active' AND current_period_end > NOW()
  `);

  const subscriptions = subscriptionStats.rows[0];

  // Ingresos mensuales
  const monthlyRevenue = await db.query(`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*) as payments,
      COALESCE(SUM(amount_cents), 0) as revenue_cents
    FROM payments
    WHERE status = 'succeeded'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month DESC
    LIMIT 12
  `);

  // Usuarios recientes
  const recentUsers = await db.query(`
    SELECT id, username, display_name, email, is_pro, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return {
    totalUsers: parseInt(users.total_users),
    proUsers: parseInt(users.pro_users),
    basicUsers: parseInt(users.basic_users),
    newToday: parseInt(users.new_today),
    newWeek: parseInt(users.new_week),
    newMonth: parseInt(users.new_month),
    conversionRate: parseFloat(conversionRate),
    totalBattles: parseInt(battles.total_battles),
    activeBattles: parseInt(battles.active_battles),
    finishedBattles: parseInt(battles.finished_battles),
    battlesToday: parseInt(battles.battles_today),
    avgRounds: parseFloat(battles.avg_rounds) || 0,
    totalPayments: parseInt(payments.total_payments) || 0,
    totalRevenueCents: parseInt(payments.total_revenue_cents) || 0,
    uniquePayingUsers: parseInt(payments.unique_paying_users) || 0,
    activeSubscriptions: parseInt(subscriptions.active_subscriptions) || 0,
    monthlyRevenue: monthlyRevenue.rows || [],
    recentUsers: recentUsers.rows || [],
  };
  } catch (error) {
    console.error("Error obteniendo estadísticas para reporte:", error);
    // Devolver datos vacíos si hay error
    return {
      totalUsers: 0,
      proUsers: 0,
      basicUsers: 0,
      newToday: 0,
      newWeek: 0,
      newMonth: 0,
      conversionRate: 0,
      totalBattles: 0,
      activeBattles: 0,
      finishedBattles: 0,
      battlesToday: 0,
      avgRounds: 0,
      totalPayments: 0,
      totalRevenueCents: 0,
      uniquePayingUsers: 0,
      activeSubscriptions: 0,
      monthlyRevenue: [],
      recentUsers: [],
    };
  }
}

/**
 * Formatea un valor en centavos a formato de moneda chilena
 */
function formatCurrency(cents) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

module.exports = {
  generateManagementReport,
};
