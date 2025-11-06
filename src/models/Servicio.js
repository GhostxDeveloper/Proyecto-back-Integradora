import { db } from '../config/firebase.js';

class Servicio {
    // Constructor con el "schema" para un Servicio
    constructor(data) {
        this.nombre = data.nombre; 
        this.categoria = data.categoria; // "alojamiento", "gastronomia", "tour"
        this.descripcion = data.descripcion;
        this.fotos = data.fotos || [];
        this.ubicacion = data.ubicacion; // Ej: "Calle Principal #123"
        this.latitud = data.latitud;
        this.longitud = data.longitud;
        this.telefono = data.telefono || '';
        this.horarios = data.horarios || 'No especificado';
        this.sitioWeb = data.sitioWeb || '';
        this.rangoPrecios = data.rangoPrecios || '$ (Económico)'; // '$', '$$', '$$$'
        this.serviciosIncluidos = data.serviciosIncluidos || []; // ["WiFi", "Alberca"]
        this.estado = data.estado || 'activo'; // 'activo' o 'inactivo'
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
        this.fechaActualizacion = data.fechaActualizacion || new Date().toISOString();
    }

    // --- Métodos Estáticos (copiados de Atraccion.js y adaptados) ---

    // Crear un nuevo servicio
    static async create(servicioData) {
        try {
            console.log('=== CREANDO SERVICIO EN FIRESTORE ===');
            const newServicio = {
                ...servicioData,
                fotos: servicioData.fotos || [],
                serviciosIncluidos: servicioData.serviciosIncluidos || [],
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };

            const docRef = await db.collection('servicios').add(newServicio);
            console.log('Servicio guardado con ID:', docRef.id);

            const snapshot = await docRef.get();
            return { id: docRef.id, ...snapshot.data() };
        } catch (error) {
            console.error('Error en Servicio.create:', error);
            throw new Error('Error al crear el servicio: ' + error.message);
        }
    }

    // Obtener todos los servicios (con filtros)
    static async getAll(filtros = {}) {
        try {
            const snapshot = await db.collection('servicios').get();
            
            if (snapshot.empty) {
                return [];
            }

            let servicios = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Aplicar filtros en memoria (igual que Atraccion.js)
            if (filtros.estado) {
                servicios = servicios.filter(s => s.estado === filtros.estado);
            }
            if (filtros.categoria) {
                servicios = servicios.filter(s => s.categoria === filtros.categoria);
            }
            if (filtros.rangoPrecios) {
                servicios = servicios.filter(s => s.rangoPrecios === filtros.rangoPrecios);
            }

            // Ordenar por fecha de creación
            servicios.sort((a, b) => {
                const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
                const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
                return fechaB - fechaA;
            });

            return servicios;
        } catch (error) {
            console.error('Error en Servicio.getAll:', error);
            throw new Error('Error al obtener servicios: ' + error.message);
        }
    }

    // Obtener un servicio por ID
    static async getById(id) {
        try {
            const doc = await db.collection('servicios').doc(id).get();
            
            if (!doc.exists) {
                throw new Error('Servicio no encontrado');
            }
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            throw new Error(`Error al obtener servicio: ${error.message}`);
        }
    }

    // Actualizar un servicio
    static async update(id, updateData) {
        try {
            const docRef = db.collection('servicios').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Servicio no encontrado');
            }

            const updatedData = {
                ...updateData,
                fechaActualizacion: new Date().toISOString()
            };

            await docRef.update(updatedData);
            return { id, ...doc.data(), ...updatedData };
        } catch (error) {
            throw new Error(`Error al actualizar servicio: ${error.message}`);
        }
    }

    // Eliminar un servicio
    static async delete(id) {
        try {
            const docRef = db.collection('servicios').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Servicio no encontrado');
            }

            await docRef.delete();
            return { message: 'Servicio eliminado correctamente' };
        } catch (error) {
            throw new Error(`Error al eliminar servicio: ${error.message}`);
        }
    }

    // Cambiar estado del servicio
    static async cambiarEstado(id, nuevoEstado) {
        try {
            const docRef = db.collection('servicios').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Servicio no encontrado');
            }

            await docRef.update({
                estado: nuevoEstado,
                fechaActualizacion: new Date().toISOString()
            });
            return { id, ...doc.data(), estado: nuevoEstado };
        } catch (error) {
            throw new Error(`Error al cambiar estado: ${error.message}`);
        }
    }

    // Buscar servicios por nombre o descripción
    static async search(termino) {
        try {
            const snapshot = await db.collection('servicios').get();
            
            const servicios = [];
            const terminoLower = termino.toLowerCase();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (
                    data.nombre.toLowerCase().includes(terminoLower) ||
                    data.descripcion.toLowerCase().includes(terminoLower)
                ) {
                    servicios.push({ id: doc.id, ...data });
                }
            });

            return servicios;
        } catch (error) {
            throw new Error(`Error al buscar servicios: ${error.message}`);
        }
    }

    // Obtener estadísticas de servicios
    static async getEstadisticas() {
        try {
            const snapshot = await db.collection('servicios').get();
            
            const stats = {
                total: snapshot.size,
                activas: 0,
                inactivas: 0,
                porCategoria: {}, // Adaptado para servicios
                porRangoPrecios: {} // Adaptado para servicios
            };

            snapshot.forEach(doc => {
                const data = doc.data();
                
                if (data.estado === 'activo') stats.activas++;
                else stats.inactivas++;

                stats.porCategoria[data.categoria] = (stats.porCategoria[data.categoria] || 0) + 1;
                stats.porRangoPrecios[data.rangoPrecios] = (stats.porRangoPrecios[data.rangoPrecios] || 0) + 1;
            });

            return stats;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

export default Servicio;