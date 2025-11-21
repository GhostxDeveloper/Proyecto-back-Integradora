import Reservacion from '../models/Reservacion.js';

// Crear reservación
export const crearReservacion = async (req, res) => {
    try {
        // El usuario viene del token (req.user) gracias al middleware que pondremos en la ruta
        const usuarioId = req.user.id; 
        const { servicioId, nombreServicio, fechaReserva, horaReserva, numeroPersonas, comentarios } = req.body;

        if (!servicioId || !fechaReserva || !horaReserva) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        const nuevaReservacion = await Reservacion.create({
            usuarioId,
            servicioId,
            nombreServicio,
            fechaReserva,
            horaReserva,
            numeroPersonas,
            comentarios
        });

        res.status(201).json({
            success: true,
            message: 'Reservación creada exitosamente',
            data: nuevaReservacion
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener MIS reservaciones (Usuario logueado)
export const obtenerMisReservaciones = async (req, res) => {
    try {
        const usuarioId = req.user.id; // Del token
        const reservaciones = await Reservacion.getByUserId(usuarioId);
        
        res.status(200).json({ success: true, data: reservaciones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener TODAS (Solo Admins)
export const obtenerTodasReservaciones = async (req, res) => {
    try {
        const reservaciones = await Reservacion.getAll();
        res.status(200).json({ success: true, data: reservaciones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cancelar o Confirmar reservación
export const cambiarEstadoReservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'confirmada', 'cancelada'

        if (!['confirmada', 'cancelada', 'pendiente'].includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        const resultado = await Reservacion.updateStatus(id, estado);
        res.status(200).json({ success: true, message: `Reservación ${estado}`, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};