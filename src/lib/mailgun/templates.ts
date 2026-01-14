/**
 * Mailgun email templates
 */

export function generateInvitationEmailHTML(data: {
  recipientName: string;
  organizationName: string;
  appName: string;
  activationUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitación a ${data.appName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #007bff; margin-top: 0;">¡Bienvenido a ${data.appName}!</h1>
    <p>Hola <strong>${data.recipientName}</strong>,</p>
    <p>Has sido invitado a unirte a <strong>${data.organizationName}</strong> en ${data.appName}.</p>
    <p style="margin: 30px 0;">
      <a href="${data.activationUrl}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Activar mi cuenta
      </a>
    </p>
    <p style="font-size: 12px; color: #666; margin-top: 30px;">
      Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
      <a href="${data.activationUrl}">${data.activationUrl}</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function generateInvitationEmailText(data: {
  recipientName: string;
  organizationName: string;
  appName: string;
  activationUrl: string;
}): string {
  return `
¡Bienvenido a ${data.appName}!

Hola ${data.recipientName},

Has sido invitado a unirte a ${data.organizationName} en ${data.appName}.

Para activar tu cuenta, visita el siguiente enlace:

${data.activationUrl}

Si tienes alguna pregunta, por favor contacta con el administrador de tu organización.

Saludos,
El equipo de ${data.appName}
  `.trim();
}
