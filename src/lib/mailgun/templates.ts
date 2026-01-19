/**
 * Mailgun email templates
 */

export function generateInvitationEmailHTML(data: {
  recipientName: string;
  organizationName: string;
  appName: string;
  activationUrl: string;
  appUrl?: string;
}): string {
  const logoUrl = data.appUrl ? `${data.appUrl}/logo.webp` : '/logo.webp';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a ${data.appName}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header con Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="${data.appName}" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1a1a1a; text-align: center;">
                ¡Bienvenido a ${data.appName}!
              </h1>
              
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hola <strong style="color: #1a1a1a;">${data.recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #333333;">
                Has sido invitado a unirte a <strong style="color: #667eea;">${data.organizationName}</strong> en ${data.appName}.
              </p>
              
              <!-- Botón CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${data.activationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Activar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${data.activationUrl}" style="color: #667eea; text-decoration: underline; word-break: break-all;">${data.activationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666; text-align: center;">
                Este es un email automático, por favor no respondas a este mensaje.<br>
                Si tienes alguna pregunta, contacta con el administrador de tu organización.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
