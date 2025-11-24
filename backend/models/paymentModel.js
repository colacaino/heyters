// models/paymentModel.js
const db = require("../db");

/**
 * Mapea fila de plans
 */
function mapPlanRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    interval: row.interval,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Mapea fila de subscriptions
 */
function mapSubscriptionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Mapea fila de payments
 */
function mapPaymentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    status: row.status,
    type: row.type,
    description: row.description,
    rawResponse: row.raw_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ============================================
 * PLANES
 * ============================================
 */

async function createPlan({
  code,
  name,
  description = null,
  priceCents,
  currency = "USD",
  interval = "month",
  isActive = true,
}) {
  const queryText = `
    INSERT INTO plans (
      code,
      name,
      description,
      price_cents,
      currency,
      interval,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    code,
    name,
    description,
    priceCents,
    currency,
    interval,
    isActive,
  ];

  const { rows } = await db.query(queryText, values);
  return mapPlanRow(rows[0]);
}

async function getPlanById(planId) {
  const { rows } = await db.query("SELECT * FROM plans WHERE id = $1", [
    planId,
  ]);
  return mapPlanRow(rows[0]);
}

async function getPlanByCode(code) {
  const { rows } = await db.query("SELECT * FROM plans WHERE code = $1", [
    code,
  ]);
  return mapPlanRow(rows[0]);
}

async function listPlans({ onlyActive = true } = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (onlyActive) {
    conditions.push(`is_active = $${index}`);
    values.push(true);
    index += 1;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `
    SELECT *
    FROM plans
    ${whereClause}
    ORDER BY price_cents ASC;
  `,
    values
  );

  return rows.map(mapPlanRow);
}

async function updatePlan(planId, data = {}) {
  const allowedFields = {
    name: "name",
    description: "description",
    priceCents: "price_cents",
    currency: "currency",
    interval: "interval",
    isActive: "is_active",
  };

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, column] of Object.entries(allowedFields)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      setClauses.push(`${column} = $${index}`);
      values.push(data[key]);
      index += 1;
    }
  }

  if (setClauses.length === 0) {
    return getPlanById(planId);
  }

  const queryText = `
    UPDATE plans
    SET ${setClauses.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  values.push(planId);

  const { rows } = await db.query(queryText, values);
  return mapPlanRow(rows[0]);
}

/* ============================================
 * SUSCRIPCIONES
 * ============================================
 */

async function createSubscription({
  userId,
  planId,
  status = "active",
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
  provider = "stripe",
  providerSubscriptionId = null,
}) {
  const queryText = `
    INSERT INTO subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      provider,
      provider_subscription_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    userId,
    planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    provider,
    providerSubscriptionId,
  ];

  const { rows } = await db.query(queryText, values);
  return mapSubscriptionRow(rows[0]);
}

/**
 * Devuelve la suscripción activa de un usuario, si existe
 */
async function getActiveSubscriptionForUser(userId) {
  const { rows } = await db.query(
    `
    SELECT *
    FROM subscriptions
    WHERE user_id = $1
      AND status = 'active'
      AND current_period_end > NOW()
    ORDER BY current_period_end DESC
    LIMIT 1;
  `,
    [userId]
  );
  return mapSubscriptionRow(rows[0]);
}

async function listSubscriptionsByUser(userId) {
  const { rows } = await db.query(
    `
    SELECT s.*, p.code AS plan_code, p.name AS plan_name
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC;
  `,
    [userId]
  );

  return rows.map((row) => ({
    ...mapSubscriptionRow(row),
    planCode: row.plan_code,
    planName: row.plan_name,
  }));
}

/**
 * Marca la suscripción para cancelarse al final del periodo
 */
async function cancelSubscriptionAtPeriodEnd(subscriptionId) {
  const { rows } = await db.query(
    `
    UPDATE subscriptions
    SET cancel_at_period_end = TRUE
    WHERE id = $1
    RETURNING *;
  `,
    [subscriptionId]
  );
  return mapSubscriptionRow(rows[0]);
}

/**
 * Actualiza estado de suscripción (ej: webhook Stripe)
 */
async function updateSubscriptionStatus(subscriptionId, status) {
  const { rows } = await db.query(
    `
    UPDATE subscriptions
    SET status = $2
    WHERE id = $1
    RETURNING *;
  `,
    [subscriptionId, status]
  );
  return mapSubscriptionRow(rows[0]);
}

/* ============================================
 * PAGOS
 * ============================================
 */

async function createPayment({
  userId,
  amountCents,
  currency = "USD",
  provider = "stripe",
  providerPaymentId = null,
  status = "pending",
  type = "one_time",
  description = null,
  rawResponse = null,
}) {
  const queryText = `
    INSERT INTO payments (
      user_id,
      amount_cents,
      currency,
      provider,
      provider_payment_id,
      status,
      type,
      description,
      raw_response
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const values = [
    userId,
    amountCents,
    currency,
    provider,
    providerPaymentId,
    status,
    type,
    description,
    rawResponse,
  ];

  const { rows } = await db.query(queryText, values);
  return mapPaymentRow(rows[0]);
}

/**
 * Cambia el estado de un pago (ej: succeeded, failed, refunded)
 */
async function updatePaymentStatus(paymentId, status, rawResponse = null) {
  const queryText = `
    UPDATE payments
    SET status = $2,
        raw_response = COALESCE($3, raw_response),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const values = [paymentId, status, rawResponse];

  const { rows } = await db.query(queryText, values);
  return mapPaymentRow(rows[0]);
}

/**
 * Lista pagos de un usuario
 */
async function listPaymentsByUser(userId, { limit = 50, page = 1 } = {}) {
  const offset = (page - 1) * limit;

  const { rows } = await db.query(
    `
    SELECT *
    FROM payments
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `,
    [userId, limit, offset]
  );

  return rows.map(mapPaymentRow);
}

/**
 * Obtiene pago por ID
 */
async function getPaymentById(paymentId) {
  const { rows } = await db.query(
    `
    SELECT *
    FROM payments
    WHERE id = $1;
  `,
    [paymentId]
  );
  return mapPaymentRow(rows[0]);
}

module.exports = {
  // Planes
  createPlan,
  getPlanById,
  getPlanByCode,
  listPlans,
  updatePlan,

  // Suscripciones
  createSubscription,
  getActiveSubscriptionForUser,
  listSubscriptionsByUser,
  cancelSubscriptionAtPeriodEnd,
  updateSubscriptionStatus,

  // Pagos
  createPayment,
  updatePaymentStatus,
  listPaymentsByUser,
  getPaymentById,
};
