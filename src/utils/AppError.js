// src/utils/AppError.js

/**
 * Clase base para errores operacionales de la aplicación
 * Los errores operacionales son errores esperados (404, validación, etc.)
 * a diferencia de bugs o errores de programación
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Marca que es un error esperado

        // Capturar stack trace (útil para debugging)
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error 404 - Recurso no encontrado
 * Uso: throw new NotFoundError('Usuario');
 */
export class NotFoundError extends AppError {
    constructor(recurso = 'Recurso') {
        super(`${recurso} no encontrado`, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Error 400 - Datos inválidos
 * Uso: throw new ValidationError('El email es inválido');
 */
export class ValidationError extends AppError {
    constructor(message = 'Datos de entrada inválidos') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

/**
 * Error 401 - No autenticado
 * Uso: throw new UnauthorizedError();
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado. Debes iniciar sesión') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Error 403 - Autenticado pero sin permisos
 * Uso: throw new ForbiddenError('Se requiere rol de administrador');
 */
export class ForbiddenError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta acción') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

/**
 * Error 409 - Conflicto (ej: email ya existe)
 * Uso: throw new ConflictError('El email ya está registrado');
 */
export class ConflictError extends AppError {
    constructor(message = 'Conflicto con el estado actual del recurso') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

/**
 * Error 429 - Demasiadas peticiones (rate limit)
 * Uso: throw new RateLimitError();
 */
export class RateLimitError extends AppError {
    constructor(message = 'Demasiadas peticiones. Intenta más tarde') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}

/**
 * Error 500 - Error interno del servidor
 * Uso: throw new InternalError('Error al procesar pago');
 */
export class InternalError extends AppError {
    constructor(message = 'Error interno del servidor') {
        super(message, 500);
        this.name = 'InternalError';
        this.isOperational = false; // Es un bug, no un error esperado
    }
}

/**
 * Error 503 - Servicio no disponible
 * Uso: throw new ServiceUnavailableError('Firebase no responde');
 */
export class ServiceUnavailableError extends AppError {
    constructor(message = 'Servicio temporalmente no disponible') {
        super(message, 503);
        this.name = 'ServiceUnavailableError';
    }
}