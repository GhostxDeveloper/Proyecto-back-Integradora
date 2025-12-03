// src/config/env.js
import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Definir esquema de validación
const envSchema = Joi.object({
    // Servidor
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development')
        .description('Entorno de ejecución'),

    PORT: Joi.number()
        .port()
        .default(3000)
        .description('Puerto del servidor'),

    // Firebase - TODAS son requeridas
    FIREBASE_API_KEY: Joi.string().required()
        .description('API Key de Firebase'),

    FIREBASE_AUTH_DOMAIN: Joi.string().required()
        .description('Dominio de autenticación de Firebase'),

    FIREBASE_PROJECT_ID: Joi.string().required()
        .description('ID del proyecto de Firebase'),

    FIREBASE_STORAGE_BUCKET: Joi.string().required()
        .description('Bucket de almacenamiento de Firebase'),

    FIREBASE_MESSAGING_SENDER_ID: Joi.string().required()
        .description('Sender ID de Firebase'),

    FIREBASE_APP_ID: Joi.string().required()
        .description('App ID de Firebase'),

    // JWT
    JWT_SECRET: Joi.string().min(32).required()
        .description('Secreto para firmar tokens JWT')
        .messages({
            'string.min': 'JWT_SECRET debe tener al menos 32 caracteres por seguridad',
            'any.required': 'JWT_SECRET es obligatorio'
        }),

    JWT_EXPIRES_IN: Joi.string()
        .default('24h')
        .description('Tiempo de expiración de tokens JWT'),

    // SendGrid
    SENDGRID_API_KEY: Joi.string().required()
        .description('API Key de SendGrid para envío de emails'),

    SENDGRID_VERIFIED_EMAIL: Joi.string().email().required()
        .description('Email verificado en SendGrid'),

    // Logging
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info')
        .description('Nivel de logging'),

}).unknown(true); // Permitir otras variables no especificadas

// Validar todas las variables
const { error, value: validatedEnv } = envSchema.validate(process.env, {
    abortEarly: false, // Mostrar TODOS los errores, no solo el primero
    stripUnknown: false // Mantener variables no definidas en el schema
});

// Si hay errores, mostrarlos de forma clara y detener ejecución
if (error) {
    console.error('\n❌ ERROR: Configuración de variables de entorno inválida\n');

    error.details.forEach((detail, index) => {
        console.error(`${index + 1}. Variable: ${detail.path.join('.')}`);
        console.error(`   Problema: ${detail.message}`);
        console.error('');
    });

    console.error('💡 Solución:');
    console.error('   1. Verifica que exista el archivo .env en la raíz del proyecto');
    console.error('   2. Asegúrate de que todas las variables requeridas estén definidas');
    console.error('   3. Revisa que los valores tengan el formato correcto\n');

    process.exit(1); // Detener ejecución
}

// Exportar configuración validada y estructurada
export const config = {
    // Entorno
    env: validatedEnv.NODE_ENV,
    port: validatedEnv.PORT,
    isDevelopment: validatedEnv.NODE_ENV === 'development',
    isProduction: validatedEnv.NODE_ENV === 'production',
    isTest: validatedEnv.NODE_ENV === 'test',

    // Firebase (agrupado)
    firebase: {
        apiKey: validatedEnv.FIREBASE_API_KEY,
        authDomain: validatedEnv.FIREBASE_AUTH_DOMAIN,
        projectId: validatedEnv.FIREBASE_PROJECT_ID,
        storageBucket: validatedEnv.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: validatedEnv.FIREBASE_MESSAGING_SENDER_ID,
        appId: validatedEnv.FIREBASE_APP_ID
    },

    // JWT (agrupado)
    jwt: {
        secret: validatedEnv.JWT_SECRET,
        expiresIn: validatedEnv.JWT_EXPIRES_IN
    },

    // SendGrid (agrupado)
    sendgrid: {
        apiKey: validatedEnv.SENDGRID_API_KEY,
        verifiedEmail: validatedEnv.SENDGRID_VERIFIED_EMAIL
    },

    // Logging
    logging: {
        level: validatedEnv.LOG_LEVEL
    }
};

// Mostrar configuración en desarrollo (sin secretos)
if (config.isDevelopment) {
    console.log('\n✅ Configuración cargada correctamente:');
    console.log(`   • Entorno: ${config.env}`);
    console.log(`   • Puerto: ${config.port}`);
    console.log(`   • Firebase Project: ${config.firebase.projectId}`);
    console.log(`   • SendGrid Email: ${config.sendgrid.verifiedEmail}`);
    console.log(`   • JWT expira en: ${config.jwt.expiresIn}`);
    console.log(`   • Nivel de log: ${config.logging.level}\n`);
}

export default config;