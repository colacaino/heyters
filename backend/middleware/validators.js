// middleware/validators.js
const { body, param, query, validationResult } = require("express-validator");
const { ValidationError } = require("./errorHandler");

/**
 * Middleware para procesar resultados de validación
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path}: ${err.msg}`)
      .join(", ");

    throw new ValidationError(errorMessages);
  }

  next();
};

/**
 * Validaciones para autenticación
 */
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username debe tener entre 3 y 30 caracteres")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username solo puede contener letras, números, _ y -"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password debe contener al menos una mayúscula, una minúscula y un número"
    ),

  body("displayName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name debe tener entre 2 y 50 caracteres"),

  validate,
];

const loginValidation = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Username o email es requerido"),

  body("password").notEmpty().withMessage("Password es requerido"),

  validate,
];

/**
 * Validaciones para batallas
 */
const createBattleValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Título debe tener entre 3 y 100 caracteres"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descripción no puede exceder 500 caracteres"),

  body("visibility")
    .isIn(["public", "private"])
    .withMessage("Visibility debe ser 'public' o 'private'"),

  body("mode")
    .isIn(["1v1", "2v2", "openmic"])
    .withMessage("Mode debe ser '1v1', '2v2' u 'openmic'"),

  body("language")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Idioma debe tener entre 2 y 50 caracteres"),

  body("maxRounds")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Max rounds debe estar entre 1 y 10"),

  body("roundDurationSeconds")
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage("Duración de round debe estar entre 30 y 600 segundos"),
  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 4, max: 100 })
    .withMessage("La contraseña de la batalla debe tener entre 4 y 100 caracteres"),

  validate,
];

const battleIdValidation = [
  param("battleId").isInt().withMessage("Battle ID debe ser un número válido"),
  validate,
];

const joinBattleValidation = [
  param("battleId").isInt().withMessage("Battle ID inválido"),
  body("role")
    .isIn(["mc1", "mc2", "moderator", "viewer"])
    .withMessage("Rol debe ser mc1, mc2, moderator o viewer"),
  validate,
];

const voteValidation = [
  param("battleId").isInt().withMessage("Battle ID inválido"),
  body("targetUserId").isInt().withMessage("Target user ID inválido"),
  body("scoreStyle")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Score style debe estar entre 0 y 10"),
  body("scoreFlow")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Score flow debe estar entre 0 y 10"),
  body("scorePunchlines")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Score punchlines debe estar entre 0 y 10"),
  validate,
];

const selectBeatValidation = [
  param("battleId").isInt().withMessage("Battle ID inválido"),
  body("beatUrl")
    .trim()
    .isURL({ protocols: ["http", "https"], require_tld: false, require_host: true })
    .withMessage("Beat URL debe ser una URL válida"),
  body("roundNumber")
    .isInt({ min: 1 })
    .withMessage("Round number debe ser mayor a 0"),
  validate,
];

const eventRequestValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("Titulo debe tener entre 3 y 150 caracteres"),
  body("opponentName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Nombre del oponente no puede exceder 150 caracteres"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descripcion no puede exceder 1000 caracteres"),
  body("eventDate")
    .isISO8601()
    .withMessage("Fecha del evento invalida"),
  body("entryFeeCents")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El precio debe ser un entero positivo"),
  body("location")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("La ubicacion debe tener entre 3 y 150 caracteres"),
  body("eventFormat")
    .optional()
    .toLowerCase()
    .isIn(["online", "presencial", "mixto"])
    .withMessage("Formato invalido"),
  body("capacity")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50000 })
    .withMessage("La capacidad debe ser un entero positivo"),
  body("coverUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("URL de portada invalida"),
  body("streamUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("URL de transmision invalida"),
  body("requirements")
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage("Los requerimientos no pueden exceder 2000 caracteres"),
  validate,
];


const eventPurchaseValidation = [
  param("eventId").isInt().withMessage("Evento inválido"),
  validate,
];

/**
 * Validaciones para pagos
 */
const createPlanValidation = [
  body("code")
    .trim()
    .matches(/^[a-z0-9_-]+$/)
    .withMessage("Code solo puede contener letras minúsculas, números, _ y -"),

  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nombre debe tener entre 3 y 100 caracteres"),

  body("priceCents")
    .isInt({ min: 0 })
    .withMessage("Precio debe ser un número positivo"),

  body("currency")
    .optional()
    .isIn(["USD", "EUR", "MXN", "COP", "ARS"])
    .withMessage("Moneda inválida"),

  body("interval")
    .isIn(["month", "year"])
    .withMessage("Intervalo debe ser 'month' o 'year'"),

  validate,
];

const checkoutValidation = [
  body("planCode")
    .trim()
    .notEmpty()
    .withMessage("planCode es obligatorio")
    .isString()
    .withMessage("planCode debe ser un string"),
  validate,
];

/**
 * Validaciones para comentarios
 */
const createCommentValidation = [
  body("battleId").isInt().withMessage("Battle ID inválido"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comentario debe tener entre 1 y 500 caracteres"),
  body("parentId")
    .optional()
    .isInt()
    .withMessage("Parent ID debe ser un número"),
  validate,
];

/**
 * Validaciones para notificaciones
 */
const notificationIdValidation = [
  param("id").isInt().withMessage("Notification ID inválido"),
  validate,
];

/**
 * Validaciones para query params
 */
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page debe ser mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit debe estar entre 1 y 100"),
  validate,
];

const battleListValidation = [
  query("status")
    .optional()
    .isIn(["scheduled", "live", "finished", "cancelled"])
    .withMessage("Status inválido"),
  query("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Visibility inválida"),
  query("mode")
    .optional()
    .isIn(["1v1", "2v2", "openmic"])
    .withMessage("Mode inválido"),
  ...paginationValidation,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createBattleValidation,
  battleIdValidation,
  joinBattleValidation,
  voteValidation,
  selectBeatValidation,
  eventRequestValidation,
  eventPurchaseValidation,
  createPlanValidation,
  checkoutValidation,
  createCommentValidation,
  notificationIdValidation,
  paginationValidation,
  battleListValidation,
};

