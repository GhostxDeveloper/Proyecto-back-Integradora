import express from 'express';
import { UserController } from '../controllers/userController.js';

const router = express.Router();

// Rutas públicas
router.post('/register', UserController.register);
router.post('/verify-email', UserController.verifyEmail);
router.post('/login', UserController.login);
router.post('/resend-verification', UserController.resendVerificationCode);

// Rutas protegidas
router.get('/profile', UserController.authenticateToken, UserController.getProfile);
router.put('/profile', UserController.authenticateToken, UserController.updateProfile);
router.put('/change-password', UserController.authenticateToken, UserController.changePassword);
router.delete('/account', UserController.authenticateToken, UserController.deleteAccount);

export default router;