import { db } from '../config/firebase.js';

// Helper para obtener el nombre de la colección según el tipo
function getCollectionName(tipoServicio) {
    if (tipoServicio === 'atraccion') return 'atracciones';
    if (tipoServicio === 'evento') return 'eventos';
    return 'servicios';
}

class Reservacion {
    constructor(data) {
        this.usuarioId = data.usuarioId;
        this.servicioId = data.servicioId;
        this.nombreServicio = data.nombreServicio; // Guardamos el nombre por si borran el servicio después
        this.fechaReserva = data.fechaReserva; // YYYY-MM-DD
        this.horaReserva = data.horaReserva; // HH:MM
        this.cantidadBoletos = data.cantidadBoletos || data.numeroPersonas || 1; // Nuevo campo con retrocompatibilidad
        this.tipoServicio = data.tipoServicio || 'servicio'; // 'servicio', 'atraccion', 'evento'
        this.comentarios = data.comentarios || '';
        this.estado = data.estado || 'pendiente'; // 'pendiente', 'confirmada', 'cancelada', 'completada'
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    // Crear una nueva reservación con validación y descuento de boletos
    static async create(data) {
        try {
            // Determinar la colección según el tipo de servicio
            const collectionName = getCollectionName(data.tipoServicio);
            
            const servicioRef = db.collection(collectionName).doc(data.servicioId);
            
            // Usar transacción para garantizar consistencia
            const resultado = await db.runTransaction(async (transaction) => {
                const servicioDoc = await transaction.get(servicioRef);
                
                if (!servicioDoc.exists) {
                    throw new Error(`${data.tipoServicio} no encontrado`);
                }
                
                const servicio = servicioDoc.data();
                const boletosDisponibles = servicio.cantidadBoletos || 0;
                const cantidadSolicitada = data.cantidadBoletos || data.numeroPersonas || 1;
                
                // Validar boletos disponibles
                if (boletosDisponibles < cantidadSolicitada) {
                    throw new Error(`No hay suficientes boletos disponibles. Disponibles: ${boletosDisponibles}, Solicitados: ${cantidadSolicitada}`);
                }
                
                // Crear la reservación
                const nuevaReservacion = {
                    usuarioId: data.usuarioId,
                    servicioId: data.servicioId,
                    nombreServicio: data.nombreServicio,
                    fechaReserva: data.fechaReserva,
                    horaReserva: data.horaReserva,
                    cantidadBoletos: cantidadSolicitada,
                    tipoServicio: data.tipoServicio || 'servicio',
                    comentarios: data.comentarios || '',
                    estado: 'pendiente',
                    fechaCreacion: new Date().toISOString()
                };
                
                const reservacionRef = db.collection('reservaciones').doc();
                transaction.set(reservacionRef, nuevaReservacion);
                
                // Descontar boletos del servicio/atracción/evento
                transaction.update(servicioRef, {
                    cantidadBoletos: boletosDisponibles - cantidadSolicitada
                });
                
                return { id: reservacionRef.id, ...nuevaReservacion };
            });
            
            return resultado;
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

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Asegurar retrocompatibilidad
                    cantidadBoletos: data.cantidadBoletos || data.numeroPersonas || 1
                };
            });
        } catch (error) {
            throw new Error('Error al obtener reservaciones del usuario: ' + error.message);
        }
    }

    // Obtener TODAS las reservaciones (Para panel de Admin)
    static async getAll() {
        try {
            const snapshot = await db.collection('reservaciones').get();
            
            if (snapshot.empty) return [];

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Asegurar retrocompatibilidad
                    cantidadBoletos: data.cantidadBoletos || data.numeroPersonas || 1
                };
            });
        } catch (error) {
            throw new Error('Error al obtener todas las reservaciones: ' + error.message);
        }
    }

    // Actualizar estado (ej. Cancelar o Confirmar) con devolución de boletos
    static async updateStatus(id, nuevoEstado) {
        try {
            const reservacionRef = db.collection('reservaciones').doc(id);
            
            // Si se cancela, devolver los boletos usando transacción
            if (nuevoEstado === 'cancelada') {
                await db.runTransaction(async (transaction) => {
                    const reservacionDoc = await transaction.get(reservacionRef);
                    
                    if (!reservacionDoc.exists) {
                        throw new Error('Reservación no encontrada');
                    }
                    
                    const reservacion = reservacionDoc.data();
                    
                    // Solo devolver boletos si no estaba cancelada antes
                    if (reservacion.estado !== 'cancelada') {
                        const collectionName = getCollectionName(reservacion.tipoServicio);
                        
                        const servicioRef = db.collection(collectionName).doc(reservacion.servicioId);
                        const servicioDoc = await transaction.get(servicioRef);
                        
                        if (servicioDoc.exists) {
                            const servicio = servicioDoc.data();
                            const boletosActuales = servicio.cantidadBoletos || 0;
                            const boletosReservados = reservacion.cantidadBoletos || reservacion.numeroPersonas || 1;
                            
                            // Devolver los boletos
                            transaction.update(servicioRef, {
                                cantidadBoletos: boletosActuales + boletosReservados
                            });
                        }
                    }
                    
                    // Actualizar estado de la reservación
                    transaction.update(reservacionRef, { estado: nuevoEstado });
                });
            } else {
                // Para otros estados, simplemente actualizar
                await reservacionRef.update({ estado: nuevoEstado });
            }
            
            const updatedDoc = await reservacionRef.get();
            return { id, ...updatedDoc.data() };
        } catch (error) {
            throw new Error('Error al actualizar estado: ' + error.message);
        }
    }
}

export default Reservacion;