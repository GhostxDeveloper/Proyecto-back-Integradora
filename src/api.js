import server from './server.js';
//import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js'; // ← Nueva importación
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'; // ← Nuevo

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

server.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

server.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.env //usando config en lugar de process.env
    });
});

// NUEVO: Capturar rutas no encontradas (debe ir DESPUÉS de todas las rutas)
server.use(notFoundHandler);

/*
server.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: config.isDevelopment ? error.message : undefined // ← Usar config
    });
});
 */

// NUEVO: Middleware global de manejo de errores
server.use(errorHandler);

//const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${config.port}`);
    console.log(`🌐 URL: http://localhost:${config.port}`);
    console.log(`💚 Health check: http://localhost:${config.port}/api/health`);
});