import express from 'express';
import {
    crearAtraccion,
    obtenerAtracciones,
    obtenerAtraccionPorId,
    actualizarAtraccion,
    eliminarAtraccion,
    cambiarEstadoAtraccion,
    buscarAtracciones,
    obtenerEstadisticas,
    restaurarAtraccion,              // ← NUEVO
    obtenerAtraccionesEliminadas,    // ← NUEVO
    eliminarPermanentemente           // ← NUEVO
} from '../controllers/atraccionCtl.js';

import { validateBody, validateQuery } from '../middleware/validate.js';
import {
    crearAtraccionSchema,
    actualizarAtraccionSchema,
    cambiarEstadoSchema,
    buscarAtraccionesQuerySchema,
    filtrosAtraccionesSchema
} from '../validators/atraccionSchema.js';
import {
    createResourceLimiter,
    searchLimiter,
    adminLimiter
} from '../middleware/rateLimiter.js';
import { UserController } from '../controllers/userController.js'; // ← NUEVO

const router = express.Router();

// Rutas de atracciones turísticas

// GET /api/atracciones/estadisticas - Obtener estadísticas
router.get('/estadisticas', obtenerEstadisticas);

// GET /api/atracciones/buscar?q=termino - Buscar atracciones
router.get('/buscar', buscarAtracciones);

// GET /api/atracciones - Obtener todas las atracciones (con filtros opcionales)
router.get('/', obtenerAtracciones);

// GET /api/atracciones/:id - Obtener una atracción por ID
router.get('/:id', obtenerAtraccionPorId);

// POST /api/atracciones - Crear una nueva atracción
router.post('/', crearAtraccion);

// PUT /api/atracciones/:id - Actualizar una atracción
router.put('/:id', actualizarAtraccion);

// PATCH /api/atracciones/:id/estado - Cambiar estado de la atracción
router.patch('/:id/estado', cambiarEstadoAtraccion);

// NUEVO: Papelera - Ver atracciones eliminadas
router.get('/admin/deleted',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    obtenerAtraccionesEliminadas
);

// DELETE /api/atracciones/:id - Eliminar una atracción
router.delete('/:id', eliminarAtraccion);

// Crear
router.post('/',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    createResourceLimiter,
    validateBody(crearAtraccionSchema),
    crearAtraccion
);

// Actualizar
router.put('/:id',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    validateBody(actualizarAtraccionSchema),
    actualizarAtraccion
);

// Cambiar estado
router.patch('/:id/estado',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    validateBody(cambiarEstadoSchema),
    cambiarEstadoAtraccion
);

// Eliminar (soft delete)
router.delete('/:id',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    eliminarAtraccion
);

// NUEVO: Restaurar atracción eliminada
router.post('/:id/restore',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    restaurarAtraccion
);

// NUEVO: Eliminación permanente (requiere confirmación)
router.delete('/:id/permanent',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    adminLimiter,
    eliminarPermanentemente
);

export default router;
