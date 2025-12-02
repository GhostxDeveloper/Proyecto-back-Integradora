import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit as limitQuery } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { DeletionRequestModel } from '../models/DeletionRequest.js';
import { UserController } from './userController.js';
import emailService from '../services/emailService.js';
import userDeletionService from '../services/userDeletionService.js';

// Función para preparar datos de la solicitud
const prepareDeletionRequestData = (docRef, data) => ({
    id: docRef.id,
    userId: data.userId,
    fullName: data.fullName,
    email: data.email,
    reason: data.reason || '',
    status: data.status,
    adminNotes: data.adminNotes || null,
    rejectionReason: data.rejectionReason || null,
    processedBy: data.processedBy || null,
    processedAt: data.processedAt || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
});

export class DeletionRequestController {
    // =====================
    // MÉTODOS DE USUARIO
    // =====================

    // Crear solicitud de eliminación (PÚBLICO - sin autenticación requerida)
    static async create(req, res) {
        try {
            const { fullName, email, reason } = req.body;

            // Validaciones básicas
            if (!fullName || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre completo y email son requeridos'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }

            // Verificar si ya existe una solicitud pendiente con ese email
            const requestsQuery = query(
                collection(db, 'deletion_requests'),
                where('email', '==', email),
                where('status', '==', 'pending')
            );
            const existingRequests = await getDocs(requestsQuery);

            if (!existingRequests.empty) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una solicitud de eliminación pendiente para este email'
                });
            }

            // Intentar buscar si existe un usuario con ese email (opcional)
            let userId = null;
            let userFirstName = fullName.split(' ')[0]; // Usar primer nombre por defecto
            
            try {
                const user = await UserController.findByEmail(email);
                if (user) {
                    userId = user.id;
                    userFirstName = user.firstName || fullName.split(' ')[0];
                }
            } catch (userError) {
                // No existe usuario con ese email, continuamos sin userId
                console.log(`No se encontró usuario con email ${email}, continuando sin userId:`, userError.message);
            }

            // Crear la solicitud
            const timestamp = new Date();
            const requestData = {
                userId: userId, // Puede ser null si no existe usuario
                fullName,
                email,
                reason: reason || 'No especificado',
                status: DeletionRequestModel.statuses.PENDING,
                adminNotes: null,
                rejectionReason: null,
                processedBy: null,
                processedAt: null,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            const docRef = await addDoc(collection(db, 'deletion_requests'), requestData);

            // Enviar correo de confirmación
            await emailService.sendDeletionRequestConfirmation(email, userFirstName);

            res.status(201).json({
                success: true,
                message: 'Solicitud de eliminación creada correctamente',
                data: prepareDeletionRequestData({ id: docRef.id }, requestData)
            });
        } catch (error) {
            console.error('Error al crear solicitud de eliminación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: error.message
            });
        }
    }

    // Obtener mi solicitud (usuario autenticado)
    static async getMyRequest(req, res) {
        try {
            const userId = req.user.id;

            // Buscar por userId
            const requestsQuery = query(
                collection(db, 'deletion_requests'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limitQuery(1)
            );

            const querySnapshot = await getDocs(requestsQuery);

            if (querySnapshot.empty) {
                // Si no hay solicitud por userId, intentar buscar por email del usuario
                const user = await UserController.findById(userId);
                if (user?.email) {
                    const emailQuery = query(
                        collection(db, 'deletion_requests'),
                        where('email', '==', user.email),
                        orderBy('createdAt', 'desc'),
                        limitQuery(1)
                    );
                    
                    const emailSnapshot = await getDocs(emailQuery);
                    
                    if (!emailSnapshot.empty) {
                        const requestDoc = emailSnapshot.docs[0];
                        const requestData = prepareDeletionRequestData(requestDoc, requestDoc.data());
                        
                        return res.json({
                            success: true,
                            data: requestData
                        });
                    }
                }

                return res.status(404).json({
                    success: false,
                    message: 'No se encontró solicitud de eliminación'
                });
            }

            const requestDoc = querySnapshot.docs[0];
            const requestData = prepareDeletionRequestData(requestDoc, requestDoc.data());

            res.json({
                success: true,
                data: requestData
            });
        } catch (error) {
            console.error('Error al obtener solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la solicitud',
                error: error.message
            });
        }
    }

    // Cancelar solicitud (usuario autenticado)
    static async cancel(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Obtener la solicitud
            const requestRef = doc(db, 'deletion_requests', id);
            const requestDoc = await getDoc(requestRef);

            if (!requestDoc.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            const requestData = requestDoc.data();

            // Verificar que pertenezca al usuario (por userId o por email)
            let canCancel = false;
            
            if (requestData.userId && requestData.userId === userId) {
                canCancel = true;
            } else {
                // Si no tiene userId o no coincide, verificar por email
                const user = await UserController.findById(userId);
                if (user && user.email === requestData.email) {
                    canCancel = true;
                }
            }

            if (!canCancel) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para cancelar esta solicitud'
                });
            }

            // Verificar que esté en estado pendiente
            if (requestData.status !== DeletionRequestModel.statuses.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cancelar solicitudes pendientes'
                });
            }

            // Actualizar a cancelado
            await updateDoc(requestRef, {
                status: DeletionRequestModel.statuses.CANCELLED,
                updatedAt: new Date()
            });

            // Enviar correo de cancelación
            const firstName = requestData.fullName.split(' ')[0];
            await emailService.sendDeletionRequestCancellation(requestData.email, firstName);

            res.json({
                success: true,
                message: 'Solicitud de eliminación cancelada correctamente'
            });
        } catch (error) {
            console.error('Error al cancelar solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cancelar la solicitud',
                error: error.message
            });
        }
    }

    // =====================
    // MÉTODOS DE ADMIN
    // =====================

    // Listar todas las solicitudes (admin)
    static async list(req, res) {
        try {
            const { status = 'all', search = '', page = 1, limit = 10 } = req.query;

            let requestsQuery = collection(db, 'deletion_requests');
            const constraints = [];

            // Filtrar por estado si no es 'all'
            if (status !== 'all' && DeletionRequestModel.validations.status.includes(status)) {
                constraints.push(where('status', '==', status));
            }

            // Ordenar por fecha de creación (más recientes primero)
            constraints.push(orderBy('createdAt', 'desc'));

            if (constraints.length > 0) {
                requestsQuery = query(requestsQuery, ...constraints);
            }

            const querySnapshot = await getDocs(requestsQuery);
            let requests = querySnapshot.docs.map(doc => 
                prepareDeletionRequestData(doc, doc.data())
            );

            // Filtrar por búsqueda (nombre o email) - en memoria
            if (search) {
                const searchLower = search.toLowerCase();
                requests = requests.filter(req => 
                    req.fullName.toLowerCase().includes(searchLower) ||
                    req.email.toLowerCase().includes(searchLower)
                );
            }

            // Paginación
            const total = requests.length;
            const pageNum = Number.parseInt(page);
            const limitNum = Number.parseInt(limit);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const paginatedRequests = requests.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: paginatedRequests,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            console.error('Error al listar solicitudes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las solicitudes',
                error: error.message
            });
        }
    }

    // Obtener solicitud por ID (admin)
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const requestRef = doc(db, 'deletion_requests', id);
            const requestDoc = await getDoc(requestRef);

            if (!requestDoc.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            const requestData = prepareDeletionRequestData(requestDoc, requestDoc.data());

            // Obtener información adicional del usuario
            const user = await UserController.findById(requestData.userId);
            if (user) {
                requestData.user = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    createdAt: user.createdAt
                };
            }

            res.json({
                success: true,
                data: requestData
            });
        } catch (error) {
            console.error('Error al obtener solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la solicitud',
                error: error.message
            });
        }
    }

    // Aprobar solicitud (admin)
    static async approve(req, res) {
        try {
            const { id } = req.params;
            const { adminNotes } = req.body;
            const adminId = req.user.id;

            console.log('Aprobando solicitud:', id, 'por admin:', adminId);

            const requestRef = doc(db, 'deletion_requests', id);
            const requestDoc = await getDoc(requestRef);

            if (!requestDoc.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            const requestData = requestDoc.data();

            if (requestData.status !== DeletionRequestModel.statuses.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: 'Esta solicitud ya fue procesada'
                });
            }

            // Actualizar solicitud
            const processedAt = new Date();
            await updateDoc(requestRef, {
                status: DeletionRequestModel.statuses.APPROVED,
                adminNotes: adminNotes || null,
                processedBy: adminId,
                processedAt,
                updatedAt: processedAt
            });

            // Obtener nombre del usuario
            let firstName = requestData.fullName.split(' ')[0];
            
            if (requestData.userId) {
                // Si hay userId, intentar obtener datos del usuario
                try {
                    const user = await UserController.findById(requestData.userId);
                    if (user?.firstName) {
                        firstName = user.firstName;
                    }
                } catch (userError) {
                    console.log('Usuario no encontrado, usando nombre del formulario:', userError.message);
                }
            }

            // Enviar correo de aprobación
            await emailService.sendDeletionRequestApproval(
                requestData.email, 
                firstName
            );

            // Eliminar/anonimizar cuenta del usuario (solo si existe userId)
            if (requestData.userId) {
                try {
                    await userDeletionService.deleteUserAccount(requestData.userId);
                } catch (error) {
                    console.error('Error al eliminar cuenta:', error);
                    // Continuar aunque falle la eliminación (ya no existe el usuario)
                }
            } else {
                console.log('No hay userId asociado, solicitud de persona sin cuenta');
            }

            res.json({
                success: true,
                message: requestData.userId 
                    ? 'Solicitud aprobada correctamente. La cuenta será eliminada.'
                    : 'Solicitud aprobada correctamente. No hay cuenta asociada para eliminar.',
                data: {
                    id,
                    status: DeletionRequestModel.statuses.APPROVED,
                    processedBy: adminId,
                    processedAt,
                    adminNotes: adminNotes || null
                }
            });
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: error.message
            });
        }
    }

    // Rechazar solicitud (admin)
    static async reject(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.user.id;

            console.log('Rechazando solicitud:', id, 'por admin:', adminId);

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar un motivo para rechazar'
                });
            }

            const requestRef = doc(db, 'deletion_requests', id);
            const requestDoc = await getDoc(requestRef);

            if (!requestDoc.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            const requestData = requestDoc.data();

            if (requestData.status !== DeletionRequestModel.statuses.PENDING) {
                return res.status(400).json({
                    success: false,
                    message: 'Esta solicitud ya fue procesada'
                });
            }

            // Actualizar solicitud
            const processedAt = new Date();
            await updateDoc(requestRef, {
                status: DeletionRequestModel.statuses.REJECTED,
                rejectionReason: reason,
                processedBy: adminId,
                processedAt,
                updatedAt: processedAt
            });

            // Obtener usuario
            const user = await UserController.findById(requestData.userId);

            // Enviar correo de rechazo
            await emailService.sendDeletionRequestRejection(
                requestData.email,
                user?.firstName || requestData.fullName,
                reason
            );

            res.json({
                success: true,
                message: 'Solicitud rechazada correctamente',
                data: {
                    id,
                    status: DeletionRequestModel.statuses.REJECTED,
                    processedBy: adminId,
                    processedAt,
                    rejectionReason: reason
                }
            });
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud',
                error: error.message
            });
        }
    }
}
