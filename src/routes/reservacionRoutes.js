import express from 'express';
import { 
    crearReservacion, 
    obtenerMisReservaciones, 
    obtenerTodasReservaciones, 
    cambiarEstadoReservacion 
} from '../controllers/reservacionController.js';
import { UserController } from '../controllers/userController.js'; // Importamos el Auth Middleware

const router = express.Router();

// Rutas protegidas (requieren Token)

// Usuario crea una reserva
router.post('/', UserController.authenticateToken, crearReservacion);

// Usuario ve SUS reservas
router.get('/mis-reservas', UserController.authenticateToken, obtenerMisReservaciones);

// Admin ve TODAS
router.get('/', UserController.authenticateToken, obtenerTodasReservaciones); 

// Admin o Usuario cambia estado (cancelar/confirmar)
router.patch('/:id/estado', UserController.authenticateToken, cambiarEstadoReservacion);

export default router;