// Modelo de Favorito - Define la estructura de datos
export const FavoritoModel = {
    // Estructura base del favorito
    structure: {
        userId: '',
        tipo: '', // 'restaurante', 'atraccion', 'evento', 'servicio'
        itemId: '',
        createdAt: null,
        updatedAt: null
    },

    // Tipos válidos de favoritos
    tipos: {
        RESTAURANTE: 'restaurante',
        ATRACCION: 'atraccion',
        EVENTO: 'evento',
        SERVICIO: 'servicio'
    },

    // Campos requeridos para creación
    requiredFields: ['userId', 'tipo', 'itemId'],

    // Validaciones básicas
    validations: {
        tipo: (val) => ['restaurante', 'atraccion', 'evento', 'servicio'].includes(val),
        userId: (val) => typeof val === 'string' && val.length > 0,
        itemId: (val) => typeof val === 'string' && val.length > 0
    }
};
