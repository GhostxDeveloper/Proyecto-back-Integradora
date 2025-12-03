// src/config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');

/**
 * Formato personalizado para logs
 * Incluye: timestamp, nivel, mensaje y metadata
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Incluir stack trace
    winston.format.metadata(), // Separar metadata del mensaje
    winston.format.json() // Formato JSON para fácil parsing
);

/**
 * Formato para consola (más legible)
 */
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;

        // Si hay metadata adicional, agregarla
        if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return logMessage;
    })
);

/**
 * Configuración de rotación diaria
 */
const rotateFileConfig = {
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m', // Máximo 20MB por archivo
    maxFiles: '14d', // Mantener logs de 14 días
    dirname: logsDir
};

/**
 * Transports (destinos de logs)
 */
const transports = [
    // Errores a archivo separado con rotación
    new DailyRotateFile({
        ...rotateFileConfig,
        filename: 'error-%DATE%.log',
        level: 'error',
        format: logFormat
    }),

    // Todos los logs a archivo general con rotación
    new DailyRotateFile({
        ...rotateFileConfig,
        filename: 'combined-%DATE%.log',
        format: logFormat
    }),

    // Logs de HTTP requests
    new DailyRotateFile({
        ...rotateFileConfig,
        filename: 'http-%DATE%.log',
        level: 'http',
        format: logFormat
    })
];

// En desarrollo, también mostrar en consola
if (config.isDevelopment) {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: 'debug' // En desarrollo, mostrar todo
        })
    );
}

/**
 * Crear logger principal
 */
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports,

    // No terminar proceso en errores no capturados
    exitOnError: false
});

/**
 * Stream para integración con Morgan (HTTP logging)
 */
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

/**
 * Métodos de logging con contexto adicional
 */

// Log de error con contexto completo
logger.logError = (error, context = {}) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        name: error.name,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        ...context
    });
};

// Log de request HTTP
logger.logRequest = (req, responseTime) => {
    logger.http({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        responseTime: `${responseTime}ms`
    });
};

// Log de operación exitosa
logger.logSuccess = (operation, data = {}) => {
    logger.info({
        operation,
        success: true,
        ...data
    });
};

// Log de inicio de servidor
logger.logServerStart = (port) => {
    logger.info({
        event: 'SERVER_START',
        port,
        environment: config.env,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
};

// Capturar excepciones no manejadas
process.on('uncaughtException', (error) => {
    logger.error({
        event: 'UNCAUGHT_EXCEPTION',
        message: error.message,
        stack: error.stack
    });

    // Dar tiempo para escribir el log antes de terminar
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Capturar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
    logger.error({
        event: 'UNHANDLED_REJECTION',
        reason: reason,
        promise: promise
    });
});

export default logger;