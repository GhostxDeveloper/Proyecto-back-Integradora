import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { collection, doc, getDoc, updateDoc, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from '../config/firebase.js';
import { UserModel } from '../models/User.js';
import emailService from '../services/emailService.js';
import verificationStore from '../services/verificationStore.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../../.env') });

const saltRounds = 10;
const secretKey = process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro_cambiar_en_produccion';

// Funciones temporales para generar códigos
const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};


// Función para preparar datos del usuario
const prepareUserData = (userDoc, userData) => ({
    id: userDoc.id,
    email: userData.email,
    firstName: userData.firstName || "Usuario",
    lastName: userData.lastName || "",
    phone: userData.phone || "",
    role: userData.role || "user",
    isActive: userData.isActive,
    emailVerified: userData.emailVerified
});

export class UserController {
    // CRUD + Business Logic
    static async findByEmail(email) {
        try {
            const userQuery = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                return null;
            }

            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            throw new Error(`Error finding user by email: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const userRef = doc(db, 'users', id);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return null;
            }

            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
    }

    static async createUser(userData) {
        try {
            const timestamp = new Date();
            const docRef = await addDoc(collection(db, "users"), {
                ...userData,
                createdAt: timestamp,
                updatedAt: timestamp
            });

            return {
                id: docRef.id,
                ...userData,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    static async updateUser(id, updateData) {
        try {
            const userRef = doc(db, 'users', id);
            const updatedData = {
                ...updateData,
                updatedAt: new Date()
            };

            await updateDoc(userRef, updatedData);
            return { success: true };
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    // Middleware de autenticación
    static async authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }

            const decoded = jwt.verify(token, secretKey);

            // Buscar usuario en Firestore
            const user = await UserController.findById(decoded.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    // HTTP Handlers
    static async register(req, res) {
        try {
            const { email, firstName, lastName, password, phone, role } = req.body;

            // Validaciones básicas
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, contraseña, nombre y apellido son requeridos'
                });
            }

            // Verificar si el email ya existe
            const existingUser = await UserController.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "El email ya está registrado"
                });
            }

            // Generar código de verificación
            const verificationCode = generateVerificationCode();

            // Almacenar datos temporalmente (sin crear usuario aún)
            verificationStore.storePendingVerification(email, {
                email,
                password,
                firstName,
                lastName,
                phone: phone || null,
                role: role || UserModel.roles.USER,
                verificationCode
            });

            // Enviar email de verificación
            try {
                await emailService.sendEmailVerification(email, firstName, verificationCode);

                res.status(200).json({
                    success: true,
                    message: 'Código de verificación enviado. Por favor revisa tu correo electrónico.',
                    data: {
                        email,
                        message: 'Ingresa el código que recibiste para completar el registro'
                    }
                });
            } catch (emailError) {
                console.error('Error enviando email de verificación:', emailError);

                // Si no se puede enviar email, mostrar código en consola para desarrollo
                console.log(`📧 CÓDIGO DE VERIFICACIÓN PARA ${email}: ${verificationCode}`);

                res.status(200).json({
                    success: true,
                    message: `Error enviando email. Código de verificación: ${verificationCode}`,
                    data: {
                        email,
                        verificationCode: verificationCode,
                        message: 'Usa este código para completar el registro'
                    }
                });
            }

        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: "Error al registrar usuario"
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }

            // Buscar usuario por email
            const user = await UserController.findByEmail(email);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            // Verificar si está activo
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo'
                });
            }

            // Verificar contraseña
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciales inválidas"
                });
            }

            // Generar token JWT
            const token = jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role
            }, secretKey, { expiresIn: '24h' });

            res.status(200).json({
                success: true,
                message: "Login exitoso",
                data: {
                    token,
                    user: prepareUserData({ id: user.id }, user)
                }
            });

        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const { password, ...userResponse } = req.user;

            res.json({
                success: true,
                data: userResponse
            });

        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const { firstName, lastName, phone } = req.body;
            const userId = req.user.id;

            // Solo actualizar campos permitidos
            const updateData = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;

            await UserController.updateUser(userId, updateData);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar perfil'
            });
        }
    }

    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            // Verificar contraseña actual
            const passwordMatch = await bcrypt.compare(currentPassword, req.user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Hash nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar en BD
            await UserController.updateUser(userId, {
                password: hashedNewPassword
            });

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña'
            });
        }
    }

    static async deleteAccount(req, res) {
        try {
            const userId = req.user.id;

            // Desactivar cuenta en lugar de eliminar
            await UserController.updateUser(userId, {
                isActive: false,
                deletedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Cuenta desactivada exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando cuenta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar cuenta'
            });
        }
    }

    // Verificar email con código y CREAR usuario
    static async verifyEmail(req, res) {
        try {
            const { email, verificationCode } = req.body;

            if (!email || !verificationCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y código de verificación son requeridos'
                });
            }

            // Verificar código de verificación
            const verification = verificationStore.verifyCode(email, verificationCode);
            if (!verification.valid) {
                return res.status(400).json({
                    success: false,
                    message: verification.error
                });
            }

            // Obtener datos almacenados temporalmente
            const pendingData = verification.data;

            // Verificar si el email ya existe (doble verificación)
            const existingUser = await UserController.findByEmail(email);
            if (existingUser) {
                verificationStore.removePendingVerification(email);
                return res.status(409).json({
                    success: false,
                    message: "El email ya está registrado"
                });
            }

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(pendingData.password, saltRounds);

            // Crear usuario con email ya verificado
            const newUser = await UserController.createUser({
                email: pendingData.email,
                password: hashedPassword,
                firstName: pendingData.firstName,
                lastName: pendingData.lastName,
                phone: pendingData.phone,
                role: pendingData.role,
                isActive: true,
                emailVerified: true, // Ya está verificado
                emailVerificationCode: null,
                emailVerificationExpires: null
            });

            // Eliminar datos temporales
            verificationStore.removePendingVerification(email);

            // No devolver campos sensibles
            const { password: _, ...userResponse } = newUser;

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente. Email verificado.',
                data: userResponse
            });

        } catch (error) {
            console.error('Error verificando email:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Reenviar código de verificación
    static async resendVerificationCode(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email es requerido'
                });
            }

            const user = await UserController.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if (user.emailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está verificado'
                });
            }

            // Generar nuevo código
            const verificationCode = generateVerificationCode();
            const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

            // Actualizar usuario
            await UserController.updateUser(user.id, {
                emailVerificationCode: verificationCode,
                emailVerificationExpires: verificationExpires
            });

            // Enviar email
            await emailService.sendEmailVerification(email, user.firstName, verificationCode);

            res.status(200).json({
                success: true,
                message: 'Código de verificación reenviado'
            });

        } catch (error) {
            console.error('Error reenviando código:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reenviar código de verificación'
            });
        }
    }


}