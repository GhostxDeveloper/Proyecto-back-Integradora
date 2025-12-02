import express from 'express';
import { DeletionRequestController } from '../controllers/deletionRequestController.js';
import { UserController } from '../controllers/userController.js';

const router = express.Router();

// =====================
// RUTAS PÚBLICAS (sin autenticación)
// =====================

// Crear solicitud de eliminación (PÚBLICO - cualquier persona puede solicitar)
// POST /api/deletion-requests
router.post(
    '/',
    DeletionRequestController.create
);

// =====================
// RUTAS ESPECÍFICAS (para evitar conflictos con rutas dinámicas)
// =====================

// Obtener mi solicitud pendiente (USUARIO - requiere autenticación)
// GET /api/deletion-requests/my-request
router.get(
    '/my-request',
    UserController.authenticateToken,
    DeletionRequestController.getMyRequest
);

// =====================
// RUTAS CON PARÁMETROS ESPECÍFICOS
// =====================

// Aprobar solicitud (ADMIN)
// PUT /api/deletion-requests/:id/approve
router.put(
    '/:id/approve',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    DeletionRequestController.approve
);

// Rechazar solicitud (ADMIN)
// PUT /api/deletion-requests/:id/reject
router.put(
    '/:id/reject',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    DeletionRequestController.reject
);

// Listar todas las solicitudes (ADMIN con query params) o Obtener solicitud específica
// GET /api/deletion-requests?status=pending (ADMIN - list)
// GET /api/deletion-requests/:id (ADMIN - getById)
router.get(
    '/',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    DeletionRequestController.list
);

// Obtener solicitud por ID (ADMIN)
// GET /api/deletion-requests/:id
router.get(
    '/:id',
    UserController.authenticateToken,
    UserController.authorizeAdmin,
    DeletionRequestController.getById
);

// Cancelar solicitud (USUARIO o ADMIN)
// DELETE /api/deletion-requests/:id
router.delete(
    '/:id',
    UserController.authenticateToken,
    DeletionRequestController.cancel
);

export default router;
