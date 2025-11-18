import { db } from '../config/firebase.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { FavoritoModel } from '../models/Favorito.js';

const COLLECTION_NAME = 'favoritos';

/**
 * Obtener todos los favoritos de un usuario con información completa del item
 */
export const getFavoritosByUserId = async (userId) => {
    try {
        console.log('[getFavoritosByUserId] Buscando favoritos para userId:', userId);
        
        // Consulta sin orderBy para evitar necesidad de índice compuesto
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        console.log('[getFavoritosByUserId] Documentos encontrados:', querySnapshot.size);
        
        const favoritos = [];

        for (const docSnap of querySnapshot.docs) {
            const favoritoData = docSnap.data();
            console.log('[getFavoritosByUserId] Procesando favorito:', docSnap.id, favoritoData);
            
            try {
                const itemCompleto = await obtenerItemCompleto(favoritoData.tipo, favoritoData.itemId);

                if (itemCompleto) {
                    favoritos.push({
                        id: docSnap.id,
                        userId: favoritoData.userId,
                        tipo: favoritoData.tipo,
                        itemId: favoritoData.itemId,
                        createdAt: favoritoData.createdAt,
                        item: itemCompleto
                    });
                } else {
                    console.log('[getFavoritosByUserId] Item no encontrado o eliminado:', favoritoData.tipo, favoritoData.itemId);
                }
            } catch (itemError) {
                console.error('[getFavoritosByUserId] Error obteniendo item:', itemError.message);
                // Continuar con el siguiente favorito
            }
        }

        // Ordenar manualmente en JavaScript
        favoritos.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA; // Descendente (más reciente primero)
        });

        console.log('[getFavoritosByUserId] Retornando favoritos:', favoritos.length);
        return favoritos;
    } catch (error) {
        console.error('[getFavoritosByUserId] Error:', error);
        console.error('[getFavoritosByUserId] Stack:', error.stack);
        throw error;
    }
};

/**
 * Obtener favoritos de un usuario filtrados por tipo
 */
export const getFavoritosByUserIdAndTipo = async (userId, tipo) => {
    try {
        // Validar tipo
        if (!FavoritoModel.validations.tipo(tipo)) {
            throw new Error('Tipo de favorito inválido');
        }

        // Consulta sin orderBy para evitar necesidad de índice compuesto
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('tipo', '==', tipo)
        );

        const querySnapshot = await getDocs(q);
        const favoritos = [];

        for (const docSnap of querySnapshot.docs) {
            const favoritoData = docSnap.data();
            const itemCompleto = await obtenerItemCompleto(favoritoData.tipo, favoritoData.itemId);

            if (itemCompleto) {
                favoritos.push({
                    id: docSnap.id,
                    userId: favoritoData.userId,
                    tipo: favoritoData.tipo,
                    itemId: favoritoData.itemId,
                    createdAt: favoritoData.createdAt,
                    item: itemCompleto
                });
            }
        }

        // Ordenar manualmente en JavaScript
        favoritos.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA; // Descendente (más reciente primero)
        });

        return favoritos;
    } catch (error) {
        console.error('Error getting favoritos by tipo:', error);
        throw error;
    }
};

/**
 * Verificar si un item es favorito de un usuario
 */
export const checkFavorito = async (userId, tipo, itemId) => {
    try {
        // Validar tipo
        if (!FavoritoModel.validations.tipo(tipo)) {
            throw new Error('Tipo de favorito inválido');
        }

        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('tipo', '==', tipo),
            where('itemId', '==', itemId)
        );

        const querySnapshot = await getDocs(q);

        return {
            esFavorito: !querySnapshot.empty,
            favoritoId: querySnapshot.empty ? null : querySnapshot.docs[0].id
        };
    } catch (error) {
        console.error('Error checking favorito:', error);
        throw error;
    }
};

/**
 * Agregar un favorito
 */
export const addFavorito = async (userId, tipo, itemId) => {
    try {
        // Validar datos
        if (!FavoritoModel.validations.userId(userId)) {
            throw new Error('ID de usuario inválido');
        }

        if (!FavoritoModel.validations.tipo(tipo)) {
            throw new Error('Tipo de favorito inválido');
        }

        if (!FavoritoModel.validations.itemId(itemId)) {
            throw new Error('ID de item inválido');
        }

        // Verificar si ya existe
        const existe = await checkFavorito(userId, tipo, itemId);
        if (existe.esFavorito) {
            throw new Error('Este item ya está en favoritos');
        }

        // Verificar que el item existe
        const itemExiste = await verificarExistenciaItem(tipo, itemId);
        if (!itemExiste) {
            throw new Error('El item no existe');
        }

        const nuevoFavorito = {
            userId,
            tipo,
            itemId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), nuevoFavorito);

        return {
            id: docRef.id,
            ...nuevoFavorito
        };
    } catch (error) {
        console.error('Error adding favorito:', error);
        throw error;
    }
};

/**
 * Eliminar un favorito
 */
export const deleteFavorito = async (favoritoId, userId) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, favoritoId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Favorito no encontrado');
        }

        // Verificar que el favorito pertenece al usuario
        const favoritoData = docSnap.data();
        if (favoritoData.userId !== userId) {
            throw new Error('No tienes permiso para eliminar este favorito');
        }

        await deleteDoc(docRef);

        return { message: 'Favorito eliminado correctamente' };
    } catch (error) {
        console.error('Error deleting favorito:', error);
        throw error;
    }
};

/**
 * Función auxiliar para obtener la información completa del item favorito
 */
const obtenerItemCompleto = async (tipo, itemId) => {
    try {
        const coleccionMap = {
            'restaurante': 'restaurants',
            'atraccion': 'atracciones',
            'evento': 'eventos',
            'servicio': 'servicios'
        };

        const coleccion = coleccionMap[tipo];
        if (!coleccion) return null;

        const docRef = doc(db, coleccion, itemId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();

        // No devolver items eliminados
        if (data.deletedAt) return null;

        return {
            id: docSnap.id,
            ...data
        };
    } catch (error) {
        console.error('Error obteniendo item completo:', error);
        return null;
    }
};

/**
 * Función auxiliar para verificar que un item existe
 */
const verificarExistenciaItem = async (tipo, itemId) => {
    try {
        const coleccionMap = {
            'restaurante': 'restaurants',
            'atraccion': 'atracciones',
            'evento': 'eventos',
            'servicio': 'servicios'
        };

        const coleccion = coleccionMap[tipo];
        if (!coleccion) return false;

        const docRef = doc(db, coleccion, itemId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const data = docSnap.data();
        // Verificar que no esté eliminado
        return !data.deletedAt;
    } catch (error) {
        console.error('Error verificando existencia:', error);
        return false;
    }
};

export default {
    getFavoritosByUserId,
    getFavoritosByUserIdAndTipo,
    checkFavorito,
    addFavorito,
    deleteFavorito
};
