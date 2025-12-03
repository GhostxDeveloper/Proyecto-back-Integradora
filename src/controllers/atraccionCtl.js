import Atraccion from '../models/Atraccion.js';
import { NotFoundError, ValidationError } from '../utils/AppError.js'; // ← Nuevo
import { asyncHandler } from '../middleware/errorHandler.js'; // ← Nuevo
import logger from '../config/logger.js'; // ← Nuevo

// Crear una nueva atracción
/*
ANTES
export const crearAtraccion = async (req, res) => {
    try {
        const atraccionData = req.body;

        // Validar campos requeridos
        const camposRequeridos = ['nombre', 'descripcion', 'latitud', 'longitud'];
        const camposFaltantes = camposRequeridos.filter(campo => !atraccionData[campo]);

        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
            });
        }

        const nuevaAtraccion = await Atraccion.create(atraccionData);

        res.status(201).json({
            success: true,
            message: 'Atracción creada exitosamente',
            data: nuevaAtraccion
        });
    } catch (error) {
        console.error('Error en crearAtraccion:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
 */

// DESPUÉS:
export const crearAtraccion = asyncHandler(async (req, res) => {
    const atraccionData = req.body;

    // Validar campos requeridos
    const camposRequeridos = ['nombre', 'descripcion', 'latitud', 'longitud'];
    const camposFaltantes = camposRequeridos.filter(campo => !atraccionData[campo]);

    if (camposFaltantes.length > 0) {
        throw new ValidationError(
            `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
        );
    }

    logger.info('Creando nueva atracción', {
        nombre: atraccionData.nombre,
        categoria: atraccionData.categoria,
        userId: req.user?.id
    });

    const nuevaAtraccion = await Atraccion.create(atraccionData);

    //Usando morgan + winston
    logger.logSuccess('Atracción creada', {
        atraccionId: nuevaAtraccion.id,
        nombre: nuevaAtraccion.nombre
    });

    res.status(201).json({
        success: true,
        message: 'Atracción creada exitosamente',
        data: nuevaAtraccion
    });
});

// Obtener todas las atracciones con filtros opcionales
export const obtenerAtracciones = async (req, res) => {
    try {
        const { estado, categoria, nivelDificultad } = req.query;

        // Pasar filtros al modelo (se aplicarán en memoria)
        const atracciones = await Atraccion.getAll({
            estado,
            categoria,
            nivelDificultad
        });

        res.status(200).json(atracciones);
    } catch (error) {
        console.error('Error en obtenerAtracciones:', error);
        res.status(500).json({ 
            message: 'Error al obtener atracciones',
            error: error.message 
        });
    }
};

/*
// Obtener una atracción por ID
export const obtenerAtraccionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const atraccion = await Atraccion.getById(id);

        res.status(200).json({
            success: true,
            data: atraccion
        });
    } catch (error) {
        console.error('Error en obtenerAtraccionPorId:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};
 */

// Obtener por ID
export const obtenerAtraccionPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const atraccion = await Atraccion.getById(id);

    if (!atraccion) {
        throw new NotFoundError('Atracción');
    }

    res.json({
        success: true,
        data: atraccion
    });
});

/*
// Actualizar una atracción
export const actualizarAtraccion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const atraccionActualizada = await Atraccion.update(id, updateData);

        res.status(200).json({
            success: true,
            message: 'Atracción actualizada exitosamente',
            data: atraccionActualizada
        });
    } catch (error) {
        console.error('Error en actualizarAtraccion:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};
 */
// Actualizar atracción
export const actualizarAtraccion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const atraccionActualizada = await Atraccion.update(id, updateData);

    res.json({
        success: true,
        message: 'Atracción actualizada exitosamente',
        data: atraccionActualizada
    });
});

/*
// Eliminar una atracción
export const eliminarAtraccion = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Atraccion.delete(id);

        res.status(200).json({
            success: true,
            message: resultado.message
        });
    } catch (error) {
        console.error('Error en eliminarAtraccion:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};
 */

// MODIFICAR: eliminar para incluir userId
export const eliminarAtraccion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedBy = req.user?.id; // ID del admin que elimina

    const resultado = await Atraccion.delete(id, deletedBy);

    res.json({
        success: true,
        message: resultado.message,
        recoverable: resultado.recoverable,
        deletedAt: resultado.deletedAt
    });
});

// NUEVO: Restaurar atracción eliminada
export const restaurarAtraccion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const restoredBy = req.user?.id;

    const resultado = await Atraccion.restore(id, restoredBy);

    res.json({
        success: true,
        message: resultado.message,
        data: resultado.data
    });
});

// NUEVO: Listar atracciones eliminadas (papelera)
export const obtenerAtraccionesEliminadas = asyncHandler(async (req, res) => {
    const eliminadas = await Atraccion.getDeleted();

    res.json({
        success: true,
        count: eliminadas.length,
        data: eliminadas
    });
});

// NUEVO: Eliminación permanente (requiere confirmación)
export const eliminarPermanentemente = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { confirmacion } = req.body;
    const adminId = req.user?.id;

    // Requiere confirmación explícita
    if (confirmacion !== 'ELIMINAR_PERMANENTEMENTE') {
        return res.status(400).json({
            success: false,
            message: 'Debes confirmar la eliminación permanente enviando: { "confirmacion": "ELIMINAR_PERMANENTEMENTE" }',
            warning: 'Esta acción NO se puede deshacer'
        });
    }

    const resultado = await Atraccion.hardDelete(id, adminId);

    logger.warn('Eliminación permanente ejecutada', {
        atraccionId: id,
        adminId,
        timestamp: new Date().toISOString()
    });

    res.json({
        success: true,
        message: resultado.message,
        recoverable: false,
        warning: 'Esta atracción ha sido eliminada permanentemente y no se puede recuperar'
    });
});

// Cambiar estado de la atracción (activa/inactiva)
export const cambiarEstadoAtraccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['activa', 'inactiva'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser "activa" o "inactiva"'
            });
        }

        const atraccionActualizada = await Atraccion.cambiarEstado(id, estado);

        res.status(200).json({
            success: true,
            message: `Atracción marcada como ${estado}`,
            data: atraccionActualizada
        });
    } catch (error) {
        console.error('Error en cambiarEstadoAtraccion:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Buscar atracciones
export const buscarAtracciones = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Parámetro de búsqueda requerido'
            });
        }

        const atracciones = await Atraccion.search(q);

        res.status(200).json({
            success: true,
            count: atracciones.length,
            data: atracciones
        });
    } catch (error) {
        console.error('Error en buscarAtracciones:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtener estadísticas de atracciones
export const obtenerEstadisticas = async (req, res) => {
    try {
        const estadisticas = await Atraccion.getEstadisticas();

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        console.error('Error en obtenerEstadisticas:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
