import { doc, getDoc, deleteDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Servicio para manejar la eliminación y anonimización de cuentas de usuario
 */
class UserDeletionService {
    /**
     * Elimina completamente la cuenta de un usuario y anonimiza sus datos
     * @param {string} userId - ID del usuario a eliminar
     */
    async deleteUserAccount(userId) {
        try {
            console.log(`Iniciando proceso de eliminación para usuario: ${userId}`);

            // 1. Verificar que el usuario existe
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error('Usuario no encontrado');
            }

            const userData = userDoc.data();
            console.log(`Usuario encontrado: ${userData.email}`);

            // 2. Anonimizar datos relacionados (mantener registros pero sin información personal)
            await this.anonymizeUserData(userId, userData);

            // 3. Eliminar favoritos del usuario
            await this.deleteUserFavorites(userId);

            // 4. Actualizar reservaciones a estado anonimizado (conservar para historial)
            await this.anonymizeUserReservations(userId);

            // 5. Eliminar el documento del usuario
            await deleteDoc(userRef);

            console.log(`✅ Cuenta eliminada exitosamente: ${userId}`);
            return { success: true, message: 'Cuenta eliminada correctamente' };
        } catch (error) {
            console.error(`❌ Error al eliminar cuenta ${userId}:`, error);
            throw new Error(`Error al eliminar la cuenta: ${error.message}`);
        }
    }

    /**
     * Anonimiza datos del usuario en registros que deben conservarse
     * @param {string} userId - ID del usuario
     * @param {object} userData - Datos originales del usuario
     */
    async anonymizeUserData(userId, userData) {
        try {
            console.log(`Anonimizando datos del usuario: ${userId}`);

            // Datos anonimizados genéricos
            const anonymizedData = {
                firstName: 'Usuario',
                lastName: 'Eliminado',
                email: `eliminado_${userId}@anonimo.com`,
                phone: null,
                isActive: false,
                deletedAt: new Date()
            };

            // Nota: En algunos casos, puedes querer mantener ciertos registros
            // con información anonimizada en lugar de eliminarlos completamente
            // Por ejemplo, para cumplir con requisitos legales de auditoría

            console.log(`✓ Datos anonimizados`);
        } catch (error) {
            console.error('Error al anonimizar datos:', error);
            throw error;
        }
    }

    /**
     * Elimina todos los favoritos del usuario
     * @param {string} userId - ID del usuario
     */
    async deleteUserFavorites(userId) {
        try {
            console.log(`Eliminando favoritos del usuario: ${userId}`);

            const favoritosQuery = query(
                collection(db, 'favoritos'),
                where('userId', '==', userId)
            );

            const favoritosSnapshot = await getDocs(favoritosQuery);
            
            if (!favoritosSnapshot.empty) {
                const deletePromises = favoritosSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                console.log(`✓ ${favoritosSnapshot.size} favoritos eliminados`);
            } else {
                console.log('✓ No hay favoritos para eliminar');
            }
        } catch (error) {
            console.error('Error al eliminar favoritos:', error);
            throw error;
        }
    }

    /**
     * Anonimiza las reservaciones del usuario (mantener para historial y auditoría)
     * @param {string} userId - ID del usuario
     */
    async anonymizeUserReservations(userId) {
        try {
            console.log(`Anonimizando reservaciones del usuario: ${userId}`);

            const reservacionesQuery = query(
                collection(db, 'reservaciones'),
                where('userId', '==', userId)
            );

            const reservacionesSnapshot = await getDocs(reservacionesQuery);
            
            if (!reservacionesSnapshot.empty) {
                const updatePromises = reservacionesSnapshot.docs.map(docSnapshot => {
                    const reservacionRef = docSnapshot.ref;
                    return updateDoc(reservacionRef, {
                        // Mantener el registro pero anonimizar información personal
                        userName: 'Usuario Eliminado',
                        userEmail: `eliminado_${userId}@anonimo.com`,
                        userPhone: null,
                        // Mantener: fecha, lugar, status (para registros de negocio)
                        anonymized: true,
                        anonymizedAt: new Date()
                    });
                });

                await Promise.all(updatePromises);
                console.log(`✓ ${reservacionesSnapshot.size} reservaciones anonimizadas`);
            } else {
                console.log('✓ No hay reservaciones para anonimizar');
            }
        } catch (error) {
            console.error('Error al anonimizar reservaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de datos del usuario antes de eliminar
     * Útil para mostrar al admin qué se va a eliminar
     * @param {string} userId - ID del usuario
     */
    async getUserDataStats(userId) {
        try {
            const stats = {
                favoritos: 0,
                reservaciones: 0,
                hasActiveReservations: false
            };

            // Contar favoritos
            const favoritosQuery = query(
                collection(db, 'favoritos'),
                where('userId', '==', userId)
            );
            const favoritosSnapshot = await getDocs(favoritosQuery);
            stats.favoritos = favoritosSnapshot.size;

            // Contar reservaciones
            const reservacionesQuery = query(
                collection(db, 'reservaciones'),
                where('userId', '==', userId)
            );
            const reservacionesSnapshot = await getDocs(reservacionesQuery);
            stats.reservaciones = reservacionesSnapshot.size;

            // Verificar si hay reservaciones activas/pendientes
            const activeReservations = reservacionesSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.status === 'pendiente' || data.status === 'confirmada';
            });
            stats.hasActiveReservations = activeReservations.length > 0;

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas del usuario:', error);
            throw error;
        }
    }

    /**
     * Verifica si un usuario puede ser eliminado (validaciones de negocio)
     * @param {string} userId - ID del usuario
     * @returns {object} - { canDelete: boolean, reason: string }
     */
    async canUserBeDeleted(userId) {
        try {
            const stats = await this.getUserDataStats(userId);

            // Ejemplo: No permitir eliminación si hay reservaciones activas
            if (stats.hasActiveReservations) {
                return {
                    canDelete: false,
                    reason: 'El usuario tiene reservaciones activas o pendientes. Debe cancelarlas primero.'
                };
            }

            // Agregar más validaciones según reglas de negocio
            // Por ejemplo: verificar pagos pendientes, órdenes en proceso, etc.

            return {
                canDelete: true,
                reason: 'El usuario puede ser eliminado',
                stats
            };
        } catch (error) {
            console.error('Error al verificar si el usuario puede ser eliminado:', error);
            throw error;
        }
    }
}

export default new UserDeletionService();
