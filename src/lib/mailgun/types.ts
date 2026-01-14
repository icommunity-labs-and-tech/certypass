/**
 * Types for Mailgun service
 */

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  appName: string; // Nombre de la aplicación (ej: "certypass")
  activationToken: string;
  activationUrl: string;
}
