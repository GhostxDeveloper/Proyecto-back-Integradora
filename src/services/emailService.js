// services/emailService.js
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { config } from '../config/env.js'; // ← Nueva importación

/*import dotenv from 'dotenv';
dotenv.config();
 */

// Configurar SendGrid
/*
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 */

//DESPUÉS
sgMail.setApiKey(config.sendgrid.apiKey);

class EmailService {
    constructor() {
        // Ya no necesitas el transporter de nodemailer
    }

    // Generar código de verificación (MANTIENE IGUAL)
    generateVerificationCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres
    }

    // Enviar email de verificación de registro (ACTUALIZADO)
    async sendEmailVerification(email, firstName, verificationCode) {
        try {
            const msg = {
                to: email,
                from: {
                    email: config.sendgrid.verifiedEmail, // ← Usar config
                    name: 'Experience Arrays' // Tu nombre de remitente
                },
                subject: 'Verifica tu cuenta - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333; text-align: center;">¡Bienvenido a Experience Arrays!</h2>
                        <p>Hola ${firstName},</p>
                        <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro, por favor verifica tu correo electrónico usando el siguiente código:</p>

                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <h3 style="color: #007bff; font-size: 24px; margin: 0; letter-spacing: 2px;">
                                ${verificationCode}
                            </h3>
                        </div>

                        <p>Este código expira en 15 minutos por seguridad.</p>
                        <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Este es un correo automático, por favor no respondas a este mensaje.
                        </p>
                    </div>
                `
            };

            // ENVÍO CON SENDGRID
            const result = await sgMail.send(msg);
            return { 
                success: true, 
                messageId: result[0].headers['x-message-id'] 
            };
        } catch (error) {
            console.error('Error enviando email de verificación:', error);
            throw new Error('Error al enviar el correo de verificación');
        }
    }

    // Enviar email de recuperación de contraseña (ACTUALIZADO)
    async sendPasswordReset(email, firstName, verificationCode) {
        try {
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_VERIFIED_EMAIL, // MISMO EMAIL VERIFICADO
                    name: 'Experience Arrays'
                },
                subject: 'Recuperación de Contraseña - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #16a085; text-align: center;">Recuperación de Contraseña</h2>
                        <p>Hola ${firstName},</p>
                        <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para crear una nueva contraseña:</p>

                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <h3 style="color: #16a085; font-size: 28px; margin: 0; letter-spacing: 3px;">
                                ${verificationCode}
                            </h3>
                        </div>

                        <p>Este código expira en 15 minutos por seguridad.</p>
                        <p style="color: #e74c3c; font-weight: bold;">Si no solicitaste restablecer tu contraseña, ignora este correo y tu contraseña permanecerá sin cambios.</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Este es un correo automático, por favor no respondas a este mensaje.<br>
                            Experience Arrays
                        </p>
                    </div>
                `
            };

            // ENVÍO CON SENDGRID
            const result = await sgMail.send(msg);
            return { 
                success: true, 
                messageId: result[0].headers['x-message-id'] 
            };
        } catch (error) {
            console.error("Error enviando email de recuperación:", error);
            throw new Error("Error al enviar el correo de recuperación");
        }
    }

    // Enviar email de confirmación de solicitud de eliminación
    async sendDeletionRequestConfirmation(email, firstName) {
        try {
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_VERIFIED_EMAIL,
                    name: 'Experience Arrays'
                },
                subject: 'Solicitud de eliminación de cuenta recibida - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #e74c3c; text-align: center;">Solicitud de Eliminación Recibida</h2>
                        <p>Hola ${firstName},</p>
                        <p>Hemos recibido tu solicitud de eliminación de cuenta.</p>
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <p style="margin: 0; color: #856404;">
                                <strong>Importante:</strong> Tu solicitud será revisada por nuestro equipo en un plazo máximo de 30 días.
                            </p>
                        </div>

                        <p>Recibirás un correo cuando tu solicitud sea procesada.</p>
                        <p>Si deseas cancelar tu solicitud, puedes hacerlo desde la sección de eliminación de cuenta en la aplicación.</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Este es un correo automático, por favor no respondas a este mensaje.<br>
                            Experience Arrays
                        </p>
                    </div>
                `
            };

            const result = await sgMail.send(msg);
            return { success: true, messageId: result[0].headers['x-message-id'] };
        } catch (error) {
            console.error('Error enviando confirmación de eliminación:', error);
            throw new Error('Error al enviar el correo de confirmación');
        }
    }

    // Enviar email de aprobación de solicitud
    async sendDeletionRequestApproval(email, firstName) {
        try {
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_VERIFIED_EMAIL,
                    name: 'Experience Arrays'
                },
                subject: 'Tu cuenta ha sido eliminada - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #e74c3c; text-align: center;">Tu cuenta ha sido eliminada</h2>
                        <p>Estimado/a ${firstName},</p>
                        <p>Tu solicitud de eliminación de cuenta ha sido procesada y aprobada.</p>

                        <h3 style="color: #333;">Datos eliminados:</h3>
                        <ul style="line-height: 1.8;">
                            <li>Información personal (nombre, correo, teléfono)</li>
                            <li>Preferencias y configuraciones</li>
                            <li>Historial de actividad</li>
                            <li>Favoritos y listas guardadas</li>
                        </ul>

                        <h3 style="color: #333;">Datos conservados por requisitos legales:</h3>
                        <ul style="line-height: 1.8;">
                            <li>Registros de transacciones: 5 años</li>
                            <li>Datos anonimizados para estadísticas</li>
                            <li>Información legal requerida por ley</li>
                        </ul>

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">
                                Si crees que esto es un error o tienes alguna pregunta, por favor contacta nuestro soporte.
                            </p>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Atentamente,<br>
                            Equipo de Experience Arrays
                        </p>
                    </div>
                `
            };

            const result = await sgMail.send(msg);
            return { success: true, messageId: result[0].headers['x-message-id'] };
        } catch (error) {
            console.error('Error enviando aprobación de eliminación:', error);
            throw new Error('Error al enviar el correo de aprobación');
        }
    }

    // Enviar email de rechazo de solicitud
    async sendDeletionRequestRejection(email, firstName, reason) {
        try {
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_VERIFIED_EMAIL,
                    name: 'Experience Arrays'
                },
                subject: 'Tu solicitud de eliminación ha sido rechazada - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #ffc107; text-align: center;">Solicitud de Eliminación Rechazada</h2>
                        <p>Estimado/a ${firstName},</p>
                        <p>Lamentamos informarte que tu solicitud de eliminación de cuenta ha sido rechazada.</p>

                        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #f5c6cb; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #721c24;">Motivo del rechazo:</h3>
                            <p style="margin-bottom: 0; color: #721c24;">${reason}</p>
                        </div>

                        <p>Tu cuenta permanece activa y puedes seguir utilizando nuestros servicios normalmente.</p>

                        <h3 style="color: #333;">¿Tienes preguntas?</h3>
                        <p>Si deseas discutir esta decisión, por favor contacta nuestro equipo de soporte:</p>
                        <ul style="line-height: 1.8;">
                            <li>Email: soporte@experiencearrays.com</li>
                            <li>Horario: Lunes a Viernes, 9:00 AM - 6:00 PM</li>
                        </ul>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Atentamente,<br>
                            Equipo de Experience Arrays
                        </p>
                    </div>
                `
            };

            const result = await sgMail.send(msg);
            return { success: true, messageId: result[0].headers['x-message-id'] };
        } catch (error) {
            console.error('Error enviando rechazo de eliminación:', error);
            throw new Error('Error al enviar el correo de rechazo');
        }
    }

    // Enviar email de cancelación de solicitud
    async sendDeletionRequestCancellation(email, firstName) {
        try {
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_VERIFIED_EMAIL,
                    name: 'Experience Arrays'
                },
                subject: 'Solicitud de eliminación cancelada - Experience Arrays',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #28a745; text-align: center;">Solicitud Cancelada</h2>
                        <p>Hola ${firstName},</p>
                        <p>Tu solicitud de eliminación de cuenta ha sido cancelada exitosamente.</p>

                        <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <p style="margin: 0; color: #155724;">
                                Tu cuenta permanece activa y puedes seguir disfrutando de todos nuestros servicios.
                            </p>
                        </div>

                        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Este es un correo automático, por favor no respondas a este mensaje.<br>
                            Experience Arrays
                        </p>
                    </div>
                `
            };

            const result = await sgMail.send(msg);
            return { success: true, messageId: result[0].headers['x-message-id'] };
        } catch (error) {
            console.error('Error enviando cancelación de eliminación:', error);
            throw new Error('Error al enviar el correo de cancelación');
        }
    }
}

export default new EmailService();