// controllers/paymentController.js
const paymentService = require("../services/paymentService");

/* ===========================================================
   HELPER RESPONSE
=========================================================== */
function send(res, status, success, message, data = null) {
  return res.status(status).json({ success, message, data });
}

/* ===========================================================
   CREAR PLAN (ADMIN)
=========================================================== */
exports.createPlan = async (req, res) => {
  try {
    const plan = await paymentService.createPlanService(req.body);
    return send(res, 201, true, "Plan creado", { plan });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   LISTAR PLANES
=========================================================== */
exports.listPlans = async (req, res) => {
  try {
    const plans = await paymentService.listPlansService();
    return send(res, 200, true, "Planes obtenidos", { plans });
  } catch (err) {
    return send(res, 500, false, err.message);
  }
};

/* ===========================================================
   CREAR CHECKOUT MERCADOPAGO
=========================================================== */
exports.createCheckout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planCode } = req.body;

    const checkout = await paymentService.createMPCheckout({
      userId,
      planCode,
    });

    return send(res, 200, true, "Checkout creado", checkout);
  } catch (err) {
    console.error("Error creando checkout MP:", err);
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   WEBHOOK MERCADOPAGO (IPN)
=========================================================== */
exports.mpWebhook = async (req, res) => {
  try {
    // MercadoPago espera respuesta 200 rápido
    const result = await paymentService.handleMPWebhook(req.body, req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error procesando webhook MP:", err.message);
    // MercadoPago reintentará si recibe error
    return res.status(200).json({ error: err.message });
  }
};

/* ===========================================================
   VERIFICAR ESTADO DE PAGO
=========================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const status = await paymentService.verifyPaymentStatus(paymentId);
    return send(res, 200, true, "Estado del pago", status);
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   OBTENER SUSCRIPCIÓN DEL USUARIO
=========================================================== */
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscription = await paymentService.getUserSubscription(userId);
    return send(res, 200, true, "Suscripción obtenida", { subscription });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

/* ===========================================================
   CANCELAR SUSCRIPCIÓN
=========================================================== */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subs = await paymentService.cancelSubscription(userId);
    return send(res, 200, true, "Suscripción cancelada", { subs });
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};
