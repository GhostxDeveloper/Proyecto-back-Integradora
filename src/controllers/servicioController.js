import Servicio from '../models/Servicio.js';

// Crear un nuevo servicio
export const crearServicio = async (req, res) => {
    try {
        const servicioData = req.body;

        // Validar campos requeridos (¡ajusta esto a tu modelo Servicio!)
        const camposRequeridos = ['nombre', 'categoria', 'descripcion', 'ubicacion', 'latitud', 'longitud'];
        const camposFaltantes = camposRequeridos.filter(campo => !servicioData[campo]);

        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
            });
        }

        const nuevoServicio = await Servicio.create(servicioData); 

        res.status(201).json({
            success: true,
            message: 'Servicio creado exitosamente',
            data: nuevoServicio
        });
    } catch (error) {
        console.error('Error en crearServicio:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtener todos los servicios con filtros opcionales
export const obtenerServicios = async (req, res) => {
    try {
        const { estado, categoria, rangoPrecios } = req.query; 

        // Pasar filtros al modelo
        const servicios = await Servicio.getAll({ 
            estado,
            categoria,
            rangoPrecios
        });

        res.status(200).json(servicios);
    } catch (error) {
        console.error('Error en obtenerServicios:', error);
        res.status(500).json({ 
            message: 'Error al obtener servicios',
            error: error.message 
        });
    }
};

// Obtener un servicio por ID
export const obtenerServicioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await Servicio.getById(id); 

        res.status(200).json({
            success: true,
            data: servicio
        });
    } catch (error) {
        console.error('Error en obtenerServicioPorId:', error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Actualizar un servicio
export const actualizarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const servicioActualizado = await Servicio.update(id, updateData); 

        res.status(200).json({
            success: true,
            message: 'Servicio actualizado exitosamente',
            data: servicioActualizado
        });
    } catch (error) {
        console.error('Error en actualizarServicio:', error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Eliminar un servicio
export const eliminarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Servicio.delete(id); 

        res.status(200).json({
            success: true,
            message: resultado.message
        });
    } catch (error) {
        console.error('Error en eliminarServicio:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Cambiar estado del servicio (activo/inactivo)
export const cambiarEstadoServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser "activo" o "inactivo"'
            });
        }

        const servicioActualizado = await Servicio.cambiarEstado(id, estado); 

        res.status(200).json({
            success: true,
            message: `Servicio marcado como ${estado}`,
            data: servicioActualizado
        });
    } catch (error) {
        console.error('Error en cambiarEstadoServicio:', error);
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Buscar servicios
export const buscarServicios = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Parámetro de búsqueda requerido'
            });
        }

        const servicios = await Servicio.search(q); 

        res.status(200).json({
            success: true,
            count: servicios.length,
            data: servicios
        });
    } catch (error) {
        console.error('Error en buscarServicios:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtener estadísticas de servicios
export const obtenerEstadisticasServicios = async (req, res) => {
    try {
        const estadisticas = await Servicio.getEstadisticas(); 

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        console.error('Error en obtenerEstadisticasServicios:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};