// services/paymentService.js
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const db = require("../db");
const { logger } = require("../utils/logger");
const {
  createPlan,
  getPlanByCode,
  listPlans,
  createSubscription,
  getActiveSubscriptionForUser,
  cancelSubscriptionAtPeriodEnd,
  createPayment,
  updatePaymentStatus,
} = require("../models/paymentModel");

require("dotenv").config();

// Configurar MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

/* ===========================================================
   PLANES
=========================================================== */

async function createPlanService({ code, name, description, priceCents, interval }) {
  return await createPlan({
    code,
    name,
    description,
    priceCents,
    interval,
  });
}

async function listPlansService() {
  return await listPlans({ onlyActive: true });
}

/* ===========================================================
   MERCADOPAGO - CREAR PREFERENCIA DE PAGO
=========================================================== */

async function createMPCheckout({ userId, planCode }) {
  const plan = await getPlanByCode(planCode);
  if (!plan) throw new Error("El plan no existe");

  // Obtener info del usuario
  const { rows } = await db.query(
    "SELECT email, display_name, username FROM users WHERE id = $1",
    [userId]
  );
  const user = rows[0];
  if (!user) throw new Error("Usuario no encontrado");

  const preference = new Preference(mpClient);

  const preferenceData = {
    items: [
      {
        id: plan.code,
        title: `Heyters Pro - ${plan.name}`,
        description: plan.description || "Suscripción mensual Heyters Pro",
        quantity: 1,
        currency_id: "CLP", // Pesos chilenos
        unit_price: Math.round(plan.priceCents / 100), // MercadoPago usa precio en unidades, no centavos
      },
    ],
    payer: {
      email: user.email,
      name: user.display_name || user.username,
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL}/payment-success`,
      failure: `${process.env.FRONTEND_URL}/payment-failure`,
      pending: `${process.env.FRONTEND_URL}/payment-pending`,
    },
    auto_return: "approved",
    external_reference: JSON.stringify({
      userId: userId,
      planId: plan.id,
      planCode: plan.code,
    }),
    notification_url: `${process.env.BACKEND_URL}/api/payments/webhook/mercadopago`,
    statement_descriptor: "HEYTERS PRO",
  };

  const response = await preference.create({ body: preferenceData });

  logger.payment(userId, "mp_checkout_created", {
    preferenceId: response.id,
    planCode,
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point, // URL para redirigir al usuario
    sandboxInitPoint: response.sandbox_init_point, // URL para pruebas
  };
}

/* ===========================================================
   MERCADOPAGO - WEBHOOK (IPN)
=========================================================== */

async function handleMPWebhook(body, query) {
  // MercadoPago envía notificaciones de diferentes formas
  const topic = query.topic || query.type || body.type;
  const paymentId = query.id || query["data.id"] || body.data?.id;

  logger.info("MP Webhook recibido", { topic, paymentId, body, query });

  if (topic === "payment" && paymentId) {
    // Obtener detalles del pago desde MercadoPago
    const paymentApi = new Payment(mpClient);
    const payment = await paymentApi.get({ id: paymentId });

    logger.info("MP Payment details", {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    });

    // Solo procesar pagos aprobados
    if (payment.status === "approved") {
      let metadata;
      try {
        metadata = JSON.parse(payment.external_reference);
      } catch (e) {
        logger.error("Error parseando external_reference", { ref: payment.external_reference });
        throw new Error("external_reference inválido");
      }

      const { userId, planId } = metadata;

      if (!userId || !planId) {
        logger.error("Metadata incompleto en pago MP", { metadata });
        throw new Error("Metadata incompleto");
      }

      // Verificar si ya procesamos este pago (idempotencia)
      const existing = await db.query(
        "SELECT id FROM payments WHERE provider_payment_id = $1",
        [String(payment.id)]
      );

      if (existing.rows.length > 0) {
        logger.info("Pago ya procesado, ignorando", { paymentId: payment.id });
        return { already_processed: true };
      }

      // TRANSACCIÓN: Pago y Suscripción deben ser atómicos
      await db.transaction(async (client) => {
        // Crear registro de pago
        await client.query(
          `INSERT INTO payments (user_id, amount_cents, currency, provider, provider_payment_id, status, type, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            Math.round(payment.transaction_amount * 100), // Convertir a centavos
            payment.currency_id || "CLP",
            "mercadopago",
            String(payment.id),
            "succeeded",
            "subscription",
            "Suscripción Heyters Pro",
          ]
        );

        // Crear/Actualizar suscripción activa
        await client.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, provider, provider_subscription_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET
             plan_id = EXCLUDED.plan_id,
             status = EXCLUDED.status,
             current_period_start = EXCLUDED.current_period_start,
             current_period_end = EXCLUDED.current_period_end,
             provider = EXCLUDED.provider,
             provider_subscription_id = EXCLUDED.provider_subscription_id`,
          [
            userId,
            planId,
            "active",
            new Date(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            "mercadopago",
            String(payment.id),
          ]
        );

        // Actualizar usuario a Pro
        await client.query(
          `UPDATE users SET can_rap = true, can_moderate = true, is_pro = true WHERE id = $1`,
          [userId]
        );
      });

      logger.payment(userId, "subscription_created", {
        planId,
        amount: payment.transaction_amount,
        provider: "mercadopago",
        paymentId: payment.id,
      });

      return { success: true, userId, planId };
    }
  }

  return { received: true };
}

/* ===========================================================
   VERIFICAR ESTADO DE PAGO (para el frontend)
=========================================================== */

async function verifyPaymentStatus(paymentId) {
  const paymentApi = new Payment(mpClient);
  const payment = await paymentApi.get({ id: paymentId });

  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    approved: payment.status === "approved",
  };
}

/* ===========================================================
   CANCELAR SUSCRIPCIÓN
=========================================================== */

async function cancelSubscription(userId) {
  const subscription = await getActiveSubscriptionForUser(userId);
  if (!subscription) throw new Error("El usuario no tiene suscripción activa");

  await cancelSubscriptionAtPeriodEnd(subscription.id);

  // Quitar permisos Pro
  await db.query(
    `UPDATE users SET can_rap = false, can_moderate = false, is_pro = false WHERE id = $1`,
    [userId]
  );

  logger.payment(userId, "subscription_cancelled", { subscriptionId: subscription.id });

  return subscription;
}

/* ===========================================================
   OBTENER INFO DE SUSCRIPCIÓN DEL USUARIO
=========================================================== */

async function getUserSubscription(userId) {
  const subscription = await getActiveSubscriptionForUser(userId);
  return subscription;
}

module.exports = {
  createPlanService,
  listPlansService,
  createMPCheckout,
  handleMPWebhook,
  verifyPaymentStatus,
  cancelSubscription,
  getUserSubscription,
};
