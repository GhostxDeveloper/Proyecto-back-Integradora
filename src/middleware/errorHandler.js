// src/middleware/errorHandler.js
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware centralizado para manejo de errores
 * Este middleware captura TODOS los errores de la aplicación
 * y los formatea de manera consistente
 */
export const errorHandler = (err, req, res, next) => {
    // Establecer valores por defecto
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // LOG del error (más tarde reemplazaremos con Winston)
    if (err.statusCode >= 500) {
        console.error('❌ Error del servidor:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
    } else if (config.isDevelopment) {
        // En desarrollo, logear todos los errores
        console.log(`⚠️  Error ${err.statusCode}:`, err.message);
    }

    // Construir respuesta base
    const errorResponse = {
        success: false,
        status: err.status,
        message: err.message
    };

    // En PRODUCCIÓN
    if (config.isProduction) {
        // Si es un error operacional (esperado), enviar mensaje
        if (err.isOperational) {
            return res.status(err.statusCode).json(errorResponse);
        }

        // Si es un bug (no operacional), NO exponer detalles internos
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Error interno del servidor. Por favor contacta soporte.'
        });
    }

    // En DESARROLLO, incluir información adicional útil
    if (config.isDevelopment) {
        errorResponse.error = err.name;
        errorResponse.stack = err.stack;
        errorResponse.details = {
            url: req.originalUrl,
            method: req.method,
            params: req.params,
            query: req.query,
            body: req.body
        };
    }

    res.status(err.statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores asíncronos
 * Express no captura errores en funciones async automáticamente,
 * este wrapper lo hace por nosotros
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware para rutas no encontradas (404)
 * Debe ir DESPUÉS de todas las rutas definidas
 */
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `No se encontró la ruta: ${req.method} ${req.originalUrl}`,
        404
    );
    next(error);
};