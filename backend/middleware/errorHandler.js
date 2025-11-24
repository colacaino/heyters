// middleware/errorHandler.js

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos de la aplicación
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflicto con el estado actual") {
    super(message, 409);
  }
}

/**
 * Manejo de errores de PostgreSQL
 */
const handleDatabaseError = (err) => {
  // Violación de unique constraint
  if (err.code === "23505") {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || "campo";
    return new ConflictError(`El ${field} ya existe en el sistema`);
  }

  // Violación de foreign key
  if (err.code === "23503") {
    return new ValidationError("Referencia a recurso inexistente");
  }

  // Violación de not null
  if (err.code === "23502") {
    const field = err.column || "campo requerido";
    return new ValidationError(`El campo ${field} es obligatorio`);
  }

  // Violación de check constraint
  if (err.code === "23514") {
    return new ValidationError("Los datos no cumplen con las validaciones");
  }

  // Error genérico de DB
  console.error("🔥 Database Error:", err);
  return new AppError("Error en la base de datos", 500, false);
};

/**
 * Manejo de errores de JWT
 */
const handleJWTError = (err) => {
  if (err.name === "JsonWebTokenError") {
    return new AuthenticationError("Token inválido");
  }

  if (err.name === "TokenExpiredError") {
    return new AuthenticationError("Token expirado");
  }

  return err;
};

/**
 * Enviar error en desarrollo
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Enviar error en producción
 */
const sendErrorProd = (err, res) => {
  // Error operacional confiable: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Error de programación: no filtrar detalles
  else {
    console.error("🔥 ERROR NO OPERACIONAL:", err);

    res.status(500).json({
      success: false,
      message: "Algo salió mal en el servidor",
    });
  }
};

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    // Transformar errores conocidos
    if (err.code && err.code.startsWith("23")) {
      error = handleDatabaseError(err);
    }

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      error = handleJWTError(err);
    }

    sendErrorProd(error, res);
  } else {
    // Por defecto usar modo desarrollo
    sendErrorDev(err, res);
  }
};

/**
 * Catch de errores async
 * Wrapper para evitar try/catch en cada controller
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handler para rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const err = new NotFoundError(
    `No se encontró la ruta ${req.originalUrl} en el servidor`
  );
  next(err);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  catchAsync,
  notFoundHandler,
};
