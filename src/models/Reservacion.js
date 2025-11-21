import { db } from '../config/firebase.js';

class Reservacion {
    constructor(data) {
        this.usuarioId = data.usuarioId;
        this.servicioId = data.servicioId;
        this.nombreServicio = data.nombreServicio; // Guardamos el nombre por si borran el servicio después
        this.fechaReserva = data.fechaReserva; // YYYY-MM-DD
        this.horaReserva = data.horaReserva; // HH:MM
        this.numeroPersonas = data.numeroPersonas || 1;
        this.comentarios = data.comentarios || '';
        this.estado = data.estado || 'pendiente'; // 'pendiente', 'confirmada', 'cancelada', 'completada'
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    // Crear una nueva reservación
    static async create(data) {
        try {
            const nuevaReservacion = {
                ...data,
                estado: 'pendiente',
                fechaCreacion: new Date().toISOString()
            };

            const docRef = await db.collection('reservaciones').add(nuevaReservacion);
            const snapshot = await docRef.get();
            
            return { id: docRef.id, ...snapshot.data() };
        } catch (error) {
            throw new Error('Error al crear la reservación: ' + error.message);
        }
    }

    // Obtener reservaciones de un usuario específico
    static async getByUserId(usuarioId) {
        try {
            const snapshot = await db.collection('reservaciones')
                .where('usuarioId', '==', usuarioId)
                .get();
            
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new Error('Error al obtener reservaciones del usuario: ' + error.message);
        }
    }

    // Obtener TODAS las reservaciones (Para panel de Admin)
    static async getAll() {
        try {
            const snapshot = await db.collection('reservaciones').get();
            
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new Error('Error al obtener todas las reservaciones: ' + error.message);
        }
    }

    // Actualizar estado (ej. Cancelar o Confirmar)
    static async updateStatus(id, nuevoEstado) {
        try {
            const docRef = db.collection('reservaciones').doc(id);
            await docRef.update({ estado: nuevoEstado });
            return { id, estado: nuevoEstado };
        } catch (error) {
            throw new Error('Error al actualizar estado: ' + error.message);
        }
    }
}

export default Reservacion;