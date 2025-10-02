import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'crissalvador175@gmail.com',
                pass: 'wboyomloeymsrvor'
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Generar código de verificación
    generateVerificationCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase(); // Código de 6 caracteres
    }


    // Enviar email de verificación de registro
    async sendEmailVerification(email, firstName, verificationCode) {
        try {
            const mailOptions = {
                from: '"Cook With Love" <crissalvador175@gmail.com>',
                to: email,
                subject: 'Verifica tu cuenta - Cook With Love',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333; text-align: center;">¡Bienvenido a Cook With Love!</h2>
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

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error enviando email de verificación:', error);
            throw new Error('Error al enviar el correo de verificación');
        }
    }

}

export default new EmailService();