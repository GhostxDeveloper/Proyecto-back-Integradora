import { db } from '../config/firebase.js';
import { NotFoundError, InternalError } from '../utils/AppError.js'; // ← Nuevo
import logger from '../config/logger.js'; // ← Nuevo

class Atraccion {
    constructor(data) {
        this.nombre = data.nombre;
        this.categoria = data.categoria;
        this.descripcion = data.descripcion;
        this.latitud = data.latitud;
        this.longitud = data.longitud;
        this.videoUrl = data.videoUrl || '';
        this.informacionCultural = data.informacionCultural;
        this.horarios = data.horarios;
        this.costoEntrada = data.costoEntrada;
        this.cantidadBoletos = data.cantidadBoletos || 0;
        this.restricciones = data.restricciones;
        this.nivelDificultad = data.nivelDificultad;
        this.servicios = data.servicios;
        this.fotos = data.fotos || [];
        this.audioUrl = data.audioUrl || '';
        // Nuevos campos soportados por el frontend
        this.restriccionEdad = data.restriccionEdad || '';
        this.permitirAlimentos = data.permitirAlimentos || '';
        this.estado = data.estado || 'activa'; // 'activa' o 'inactiva'
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
        this.fechaActualizacion = data.fechaActualizacion || new Date().toISOString();
        // NUEVO: Campo para soft delete
        this.deletedAt = data.deletedAt || null;
        this.deletedBy = data.deletedBy || null;
    }

    // Crear una nueva atracción
    static async create(atraccionData) {
        try {
            logger.debug('=== CREANDO ATRACCIÓN EN FIRESTORE ===');
            logger.debug('Datos recibidos:', {
                nombre: atraccionData.nombre,
                cantidadFotos: atraccionData.fotos?.length || 0,
                tieneAudio: !!atraccionData.audioUrl
            });

            const newAtraccion = {
                ...atraccionData,
                fotos: atraccionData.fotos || [], // Asegurar que sea un array
                audioUrl: atraccionData.audioUrl || '',
                // Asegurar que los nuevos campos existan con valores por defecto
                restriccionEdad: atraccionData.restriccionEdad || '',
                permitirAlimentos: atraccionData.permitirAlimentos || '',
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };

            logger.info('Atracción preparada para guardar:', {
                ...newAtraccion,
                fotos: `Array con ${newAtraccion.fotos.length} elementos`,
                audioUrl: newAtraccion.audioUrl ? 'Presente' : 'Ausente'
            });

            const docRef = await db.collection('atracciones').add(newAtraccion);
            logger.info('Atracción guardada con ID:', docRef.id);

            const snapshot = await docRef.get();
            const savedData = { id: docRef.id, ...snapshot.data() };

            logger.info('Datos guardados verificados:', {
                id: savedData.id,
                cantidadFotos: savedData.fotos?.length || 0
            });

            return savedData;
        } catch (error) {
            logger.error('Error en create:', error);
            throw new Error('Error al crear la atracción: ' + error.message);
        }
    }

    // Obtener todas las atracciones
    static async getAll(filtros = {}) {
        try {
            // Obtener TODAS las atracciones sin filtros en Firestore
            const atraccionesSnapshot = await db.collection('atracciones').get();
            
            if (atraccionesSnapshot.empty) {
                return [];
            }

            // Convertir a array
            let atracciones = atraccionesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Aplicar filtros en memoria (NO en Firestore)
            if (filtros.estado) {
                atracciones = atracciones.filter(a => a.estado === filtros.estado);
            }

            if (filtros.categoria) {
                atracciones = atracciones.filter(a => a.categoria === filtros.categoria);
            }

            if (filtros.nivelDificultad) {
                atracciones = atracciones.filter(a => a.nivelDificultad === filtros.nivelDificultad);
            }

            // Ordenar por fecha de creación (en memoria)
            atracciones.sort((a, b) => {
                const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
                const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
                return fechaB - fechaA;
            });

            return atracciones;
        } catch (error) {
            console.error('Error en getAll:', error);
            throw new Error('Error al obtener atracciones: ' + error.message);
        }
    }

    /*
    // Obtener una atracción por ID
    static async getById(id) {
        try {
            const doc = await db.collection('atracciones').doc(id).get();
            
            if (!doc.exists) {
                throw new Error('Atracción no encontrada');
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            throw new Error(`Error al obtener atracción: ${error.message}`);
        }
    }
     */

    static async getById(id) {
        try {
            const doc = await db.collection('atracciones').doc(id).get();

            if (!doc.exists) {
                throw new NotFoundError('Atracción'); // ← Usa clase específica
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            // Si ya es un AppError, re-lanzarlo
            if (error.isOperational) {
                throw error;
            }
            // Si es otro tipo de error (Firebase caído, etc), envolver
            throw new InternalError(`Error al obtener atracción: ${error.message}`);
        }
    }

    /*
    // Actualizar una atracción
    static async update(id, updateData) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Atracción no encontrada');
            }

            const updatedData = {
                ...updateData,
                fechaActualizacion: new Date().toISOString()
            };

            await docRef.update(updatedData);

            return {
                id,
                ...doc.data(),
                ...updatedData
            };
        } catch (error) {
            throw new Error(`Error al actualizar atracción: ${error.message}`);
        }
    }
     */

    static async update(id, updateData) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundError('Atracción');
            }

            const updatedData = {
                ...updateData,
                fechaActualizacion: new Date().toISOString()
            };

            await docRef.update(updatedData);

            return {
                id,
                ...doc.data(),
                ...updatedData
            };
        } catch (error) {
            if (error.isOperational) {
                throw error;
            }
            throw new InternalError(`Error al actualizar atracción: ${error.message}`);
        }
    }

    /*
    // Eliminar una atracción
    static async delete(id) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Atracción no encontrada');
            }

            await docRef.delete();
            return { message: 'Atracción eliminada correctamente' };
        } catch (error) {
            throw new Error(`Error al eliminar atracción: ${error.message}`);
        }
    }
     */

    // REEMPLAZAR: delete por soft delete
    static async delete(id, deletedBy = null) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundError('Atracción');
            }

            const data = doc.data();

            // Verificar si ya está eliminada
            if (data.deletedAt) {
                throw new Error('La atracción ya fue eliminada previamente');
            }

            // SOFT DELETE: marcar como eliminada
            const deletedAt = new Date().toISOString();
            await docRef.update({
                deletedAt,
                deletedBy, // ID del admin que eliminó
                estado: 'eliminada',
                fechaActualizacion: deletedAt
            });

            logger.info('Atracción eliminada (soft delete)', {
                atraccionId: id,
                nombre: data.nombre,
                deletedBy,
                deletedAt
            });

            return {
                message: 'Atracción eliminada correctamente',
                recoverable: true,
                deletedAt
            };
        } catch (error) {
            if (error.isOperational) {
                throw error;
            }
            logger.error('Error eliminando atracción', { id, error: error.message });
            throw new InternalError(`Error al eliminar atracción: ${error.message}`);
        }
    }

    // NUEVO: Restaurar atracción eliminada
    static async restore(id, restoredBy = null) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundError('Atracción');
            }

            const data = doc.data();

            // Verificar que esté eliminada
            if (!data.deletedAt) {
                throw new Error('La atracción no está eliminada');
            }

            // Restaurar
            await docRef.update({
                deletedAt: null,
                deletedBy: null,
                estado: 'activa',
                fechaActualizacion: new Date().toISOString(),
                restoredAt: new Date().toISOString(),
                restoredBy
            });

            logger.info('Atracción restaurada', {
                atraccionId: id,
                nombre: data.nombre,
                restoredBy
            });

            return {
                message: 'Atracción restaurada correctamente',
                data: { id, ...data, deletedAt: null, estado: 'activa' }
            };
        } catch (error) {
            if (error.isOperational) {
                throw error;
            }
            throw new InternalError(`Error al restaurar atracción: ${error.message}`);
        }
    }

    // NUEVO: Obtener atracciones eliminadas (solo admin)
    static async getDeleted() {
        try {
            const snapshot = await db.collection('atracciones').get();

            const deleted = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.deletedAt) // Solo eliminadas
                .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)); // Más recientes primero

            logger.debug('Atracciones eliminadas recuperadas', { count: deleted.length });

            return deleted;
        } catch (error) {
            throw new InternalError('Error al obtener atracciones eliminadas: ' + error.message);
        }
    }

    // NUEVO: Eliminación permanente (solo admin, usar con precaución)
    static async hardDelete(id, adminId) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new NotFoundError('Atracción');
            }

            const data = doc.data();

            // Verificar que esté eliminada primero (soft delete)
            if (!data.deletedAt) {
                throw new Error('La atracción debe estar eliminada antes de borrarla permanentemente');
            }

            // HARD DELETE: eliminar permanentemente
            await docRef.delete();

            logger.warn('Atracción eliminada PERMANENTEMENTE', {
                atraccionId: id,
                nombre: data.nombre,
                adminId,
                warning: 'Esta acción no se puede deshacer'
            });

            return {
                message: 'Atracción eliminada permanentemente',
                recoverable: false
            };
        } catch (error) {
            if (error.isOperational) {
                throw error;
            }
            throw new InternalError(`Error al eliminar permanentemente: ${error.message}`);
        }
    }

    // Cambiar estado de la atracción
    static async cambiarEstado(id, nuevoEstado) {
        try {
            const docRef = db.collection('atracciones').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Atracción no encontrada');
            }

            await docRef.update({
                estado: nuevoEstado,
                fechaActualizacion: new Date().toISOString()
            });

            return {
                id,
                ...doc.data(),
                estado: nuevoEstado
            };
        } catch (error) {
            throw new Error(`Error al cambiar estado: ${error.message}`);
        }
    }

    // Buscar atracciones por nombre o descripción
    static async search(termino) {
        try {
            const snapshot = await db.collection('atracciones').get();
            
            const atracciones = [];
            const terminoLower = termino.toLowerCase();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (
                    data.nombre.toLowerCase().includes(terminoLower) ||
                    data.descripcion.toLowerCase().includes(terminoLower)
                ) {
                    atracciones.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            return atracciones;
        } catch (error) {
            throw new Error(`Error al buscar atracciones: ${error.message}`);
        }
    }

    // Obtener estadísticas
    static async getEstadisticas() {
        try {
            const snapshot = await db.collection('atracciones').get();
            
            const stats = {
                total: snapshot.size,
                activas: 0,
                inactivas: 0,
                porCategoria: {},
                porNivelDificultad: {}
            };

            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Contar por estado
                if (data.estado === 'activa') stats.activas++;
                else stats.inactivas++;

                // Contar por categoría
                stats.porCategoria[data.categoria] = (stats.porCategoria[data.categoria] || 0) + 1;

                // Contar por nivel de dificultad
                stats.porNivelDificultad[data.nivelDificultad] = (stats.porNivelDificultad[data.nivelDificultad] || 0) + 1;
            });

            return stats;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

export default Atraccion;
