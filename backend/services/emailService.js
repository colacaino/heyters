// services/emailService.js
const { Resend } = require("resend");
const crypto = require("crypto");
const db = require("../db");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Heyters";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * GENERAR TOKEN ALEATORIO
 * Genera un token seguro de 32 bytes
 */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * ENVIAR EMAIL DE VERIFICACIÓN
 * Crea un token de verificación y envía email al usuario
 */
async function sendVerificationEmail(userId, email, username) {
  try {
    // Generar token único
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en BD
    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    // URL de verificación
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: "Verifica tu cuenta en Heyters",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                padding: 40px;
                text-align: center;
              }
              .content {
                background: white;
                border-radius: 8px;
                padding: 30px;
                margin-top: 20px;
              }
              h1 {
                color: white;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .subtitle {
                color: rgba(255, 255, 255, 0.9);
                margin: 0 0 20px 0;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                text-align: left;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>¡Bienvenido a Heyters!</h1>
              <p class="subtitle">Plataforma de batallas de rap en vivo</p>

              <div class="content">
                <p>Hola <strong>${username}</strong>,</p>

                <p>Gracias por registrarte en <strong>Heyters</strong>. Para completar tu registro y comenzar a participar en batallas épicas, necesitamos verificar tu correo electrónico.</p>

                <a href="${verificationUrl}" class="button">
                  Verificar mi cuenta
                </a>

                <div class="warning">
                  <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas.
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                  <code style="background: #f5f5f5; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">${verificationUrl}</code>
                </p>

                <p style="font-size: 14px; color: #999; margin-top: 30px;">
                  Si no creaste esta cuenta, puedes ignorar este mensaje.
                </p>
              </div>

              <div class="footer">
                <p>Este email fue enviado por Heyters<br>
                ¿Tienes dudas? Contáctanos en support@heyters.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error enviando email de verificación:", error);
      throw new Error("No se pudo enviar el email de verificación");
    }

    console.log("✅ Email de verificación enviado:", { userId, email, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ Error en sendVerificationEmail:", error);
    throw error;
  }
}

/**
 * VERIFICAR EMAIL
 * Verifica el token y marca el email como verificado
 */
async function verifyEmail(token) {
  try {
    // Buscar token
    const result = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error("Token de verificación inválido");
    }

    const tokenData = result.rows[0];

    // Verificar si ya fue usado
    if (tokenData.used_at) {
      throw new Error("Este token ya fue utilizado");
    }

    // Verificar si expiró
    if (new Date() > new Date(tokenData.expires_at)) {
      throw new Error("Este token ha expirado");
    }

    // Marcar token como usado
    await db.query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [tokenData.id]
    );

    // Marcar email como verificado
    await db.query(
      `UPDATE users
       SET is_verified = true
       WHERE id = $1`,
      [tokenData.user_id]
    );

    console.log("✅ Email verificado exitosamente:", tokenData.user_id);
    return { success: true, userId: tokenData.user_id };
  } catch (error) {
    console.error("❌ Error en verifyEmail:", error);
    throw error;
  }
}

/**
 * ENVIAR EMAIL DE RECUPERACIÓN DE CONTRASEÑA
 * Crea un token de reset y envía email al usuario
 */
async function sendPasswordResetEmail(email) {
  try {
    // Buscar usuario por email
    const userResult = await db.query(
      "SELECT id, username, email FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      console.log("⚠️ Intento de reset para email no registrado:", email);
      return { success: true, message: "Si el email existe, recibirás un link de recuperación" };
    }

    const user = userResult.rows[0];

    // Generar token único
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

    // Guardar token en BD
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // URL de reset
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: "Recupera tu contraseña - Heyters",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                border-radius: 10px;
                padding: 40px;
                text-align: center;
              }
              .content {
                background: white;
                border-radius: 8px;
                padding: 30px;
                margin-top: 20px;
              }
              h1 {
                color: white;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .subtitle {
                color: rgba(255, 255, 255, 0.9);
                margin: 0 0 20px 0;
              }
              .button {
                display: inline-block;
                background: #f5576c;
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                text-align: left;
              }
              .alert {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                text-align: left;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Recuperación de contraseña</h1>
              <p class="subtitle">Heyters - Batallas de rap</p>

              <div class="content">
                <p>Hola <strong>${user.username}</strong>,</p>

                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Heyters.</p>

                <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>

                <a href="${resetUrl}" class="button">
                  Restablecer contraseña
                </a>

                <div class="warning">
                  <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora.
                </div>

                <div class="alert">
                  <strong>🔒 Seguridad:</strong> Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá sin cambios.
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                  <code style="background: #f5f5f5; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">${resetUrl}</code>
                </p>
              </div>

              <div class="footer">
                <p>Este email fue enviado por Heyters<br>
                ¿Tienes dudas? Contáctanos en support@heyters.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error enviando email de recuperación:", error);
      throw new Error("No se pudo enviar el email de recuperación");
    }

    console.log("✅ Email de recuperación enviado:", { userId: user.id, email, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ Error en sendPasswordResetEmail:", error);
    throw error;
  }
}

/**
 * VERIFICAR TOKEN DE RESET Y CAMBIAR CONTRASEÑA
 * Verifica el token y actualiza la contraseña del usuario
 */
async function resetPassword(token, newPassword) {
  const bcrypt = require("bcryptjs");

  try {
    // Buscar token
    const result = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error("Token de recuperación inválido");
    }

    const tokenData = result.rows[0];

    // Verificar si ya fue usado
    if (tokenData.used_at) {
      throw new Error("Este token ya fue utilizado");
    }

    // Verificar si expiró
    if (new Date() > new Date(tokenData.expires_at)) {
      throw new Error("Este token ha expirado. Solicita uno nuevo");
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await db.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, tokenData.user_id]
    );

    // Marcar token como usado
    await db.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [tokenData.id]
    );

    console.log("✅ Contraseña actualizada exitosamente:", tokenData.user_id);
    return { success: true, userId: tokenData.user_id };
  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  sendPasswordResetEmail,
  resetPassword,
};
