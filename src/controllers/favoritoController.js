import favoritoService from '../services/favoritoService.js';

export class FavoritoController {
    // GET /favoritos - Obtener todos los favoritos del usuario autenticado
    static async getAllFavoritos(req, res) {
        try {
            const userId = req.user.id;
            const favoritos = await favoritoService.getFavoritosByUserId(userId);

            // Retornar directamente el array para compatibilidad con frontend
            res.status(200).json(favoritos);
        } catch (error) {
            console.error('Error obteniendo favoritos:', error);
            console.error('Error details:', error.message, error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos',
                error: error.message
            });
        }
    }

    // GET /favoritos/tipo/:tipo - Obtener favoritos por tipo
    static async getFavoritosByTipo(req, res) {
        try {
            const userId = req.user.id;
            const { tipo } = req.params;

            const favoritos = await favoritoService.getFavoritosByUserIdAndTipo(userId, tipo);

            // Retornar directamente el array
            res.status(200).json(favoritos);
        } catch (error) {
            console.error('Error obteniendo favoritos por tipo:', error);

            if (error.message === 'Tipo de favorito inválido') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos'
            });
        }
    }

    // GET /favoritos/check/:tipo/:itemId - Verificar si es favorito
    static async checkFavorito(req, res) {
        try {
            const userId = req.user.id;
            const { tipo, itemId } = req.params;

            const resultado = await favoritoService.checkFavorito(userId, tipo, itemId);

            res.status(200).json({
                success: true,
                data: resultado
            });
        } catch (error) {
            console.error('Error verificando favorito:', error);

            if (error.message === 'Tipo de favorito inválido') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al verificar favorito'
            });
        }
    }

    // POST /favoritos - Agregar a favoritos
    static async addFavorito(req, res) {
        try {
            const userId = req.user.id;
            const { tipo, itemId } = req.body;

            console.log('[addFavorito] Request:', { userId, tipo, itemId });

            if (!tipo || !itemId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo e itemId son requeridos'
                });
            }

            const nuevoFavorito = await favoritoService.addFavorito(userId, tipo, itemId);

            console.log('[addFavorito] Success:', nuevoFavorito.id);

            res.status(201).json({
                success: true,
                message: 'Agregado a favoritos exitosamente',
                data: nuevoFavorito
            });
        } catch (error) {
            console.error('[addFavorito] Error:', error.message);

            if (
                error.message === 'Tipo de favorito inválido' ||
                error.message === 'ID de usuario inválido' ||
                error.message === 'ID de item inválido' ||
                error.message === 'Este item ya está en favoritos' ||
                error.message === 'El item no existe'
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    alreadyExists: error.message === 'Este item ya está en favoritos'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al agregar a favoritos',
                error: error.message
            });
        }
    }

    // DELETE /favoritos/:id - Eliminar de favoritos
    static async deleteFavorito(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await favoritoService.deleteFavorito(id, userId);

            res.status(200).json({
                success: true,
                message: 'Eliminado de favoritos exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando favorito:', error);

            if (error.message === 'Favorito no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message === 'No tienes permiso para eliminar este favorito') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al eliminar favorito'
            });
        }
    }
}
