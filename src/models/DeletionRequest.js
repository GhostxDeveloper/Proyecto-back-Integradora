// Modelo de Solicitud de Eliminación de Cuenta
export const DeletionRequestModel = {
    // Estructura base de la solicitud
    structure: {
        userId: '',
        fullName: '',
        email: '',
        reason: '',
        status: 'pending', // 'pending', 'approved', 'rejected', 'cancelled'
        adminNotes: null,
        rejectionReason: null,
        processedBy: null, // ID del admin que procesó
        processedAt: null,
        createdAt: null,
        updatedAt: null
    },

    // Estados posibles
    statuses: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        CANCELLED: 'cancelled'
    },

    // Campos requeridos para crear solicitud
    requiredFields: ['userId', 'fullName', 'email'],

    // Campos que se pueden actualizar
    updatableFields: ['status', 'adminNotes', 'rejectionReason', 'processedBy', 'processedAt'],

    // Validaciones básicas
    validations: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        status: ['pending', 'approved', 'rejected', 'cancelled']
    }
};
