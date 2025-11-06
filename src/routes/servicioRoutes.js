import express from 'express';
import {
    crearServicio,
    obtenerServicios,
    obtenerServicioPorId,
    actualizarServicio,
    eliminarServicio,
    cambiarEstadoServicio,
    buscarServicios,
    obtenerEstadisticasServicios
} from '../controllers/servicioController.js'; // <-- Importamos el nuevo controlador

const router = express.Router();

// Rutas de servicios

// GET /api/servicios/estadisticas - Obtener estadísticas
router.get('/estadisticas', obtenerEstadisticasServicios);

// GET /api/servicios/buscar?q=termino - Buscar servicios
router.get('/buscar', buscarServicios);

// GET /api/servicios - Obtener todos los servicios (con filtros opcionales)
router.get('/', obtenerServicios);

// GET /api/servicios/:id - Obtener un servicio por ID
router.get('/:id', obtenerServicioPorId);

// POST /api/servicios - Crear un nuevo servicio
router.post('/', crearServicio);

// PUT /api/servicios/:id - Actualizar un servicio
router.put('/:id', actualizarServicio);

// PATCH /api/servicios/:id/estado - Cambiar estado del servicio
router.patch('/:id/estado', cambiarEstadoServicio);

// DELETE /api/servicios/:id - Eliminar un servicio
router.delete('/:id', eliminarServicio);

export default router;