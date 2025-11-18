import express from 'express';
import { FavoritoController } from '../controllers/favoritoController.js';
import { UserController } from '../controllers/userController.js';

const router = express.Router();

// Todas las rutas de favoritos requieren autenticación
// Los favoritos son siempre del usuario autenticado

// GET /favoritos - Obtener todos los favoritos del usuario autenticado
router.get(
    '/',
    UserController.authenticateToken,
    FavoritoController.getAllFavoritos
);

// GET /favoritos/tipo/:tipo - Obtener favoritos filtrados por tipo
router.get(
    '/tipo/:tipo',
    UserController.authenticateToken,
    FavoritoController.getFavoritosByTipo
);

// GET /favoritos/check/:tipo/:itemId - Verificar si un item es favorito
router.get(
    '/check/:tipo/:itemId',
    UserController.authenticateToken,
    FavoritoController.checkFavorito
);

// POST /favoritos - Agregar a favoritos
router.post(
    '/',
    UserController.authenticateToken,
    FavoritoController.addFavorito
);

// DELETE /favoritos/:id - Eliminar de favoritos
router.delete(
    '/:id',
    UserController.authenticateToken,
    FavoritoController.deleteFavorito
);

export default router;
