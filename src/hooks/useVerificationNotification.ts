'use client';

import { useEffect } from 'react';
import { publishErrorNotification, publishWarningNotification } from '@/lib/notificationEvents';

interface UseVerificationNotificationProps {
  showNotification?: boolean;
  notificationType?: 'error' | 'warning';
  customMessage?: string;
}

export function useVerificationNotification({
  showNotification = true,
  notificationType = 'error',
  customMessage
}: UseVerificationNotificationProps = {}) {
  
  const showVerificationRequiredNotification = (context: string = 'operación') => {
    if (!showNotification) return;

    const defaultMessage = `Para certificar automáticamente los estados y evidencias, necesitas completar tu verificación de identidad. Completa el proceso KYC en tu perfil.`;
    
    const message = customMessage || defaultMessage;
    
    if (notificationType === 'error') {
      publishErrorNotification(
        '⚠️ Verificación de Usuario Requerida',
        message
      );
    } else {
      publishWarningNotification(
        '⚠️ Verificación de Usuario Requerida',
        message
      );
    }
  };

  const showVerificationErrorNotification = (error: Error) => {
    if (!showNotification) return;

    publishErrorNotification(
      '❌ Error en Certificación',
      `La ${customMessage || 'operación'} se completó correctamente, pero hubo un error al certificar en iCommunity. Puedes reintentar más tarde o contactar soporte.`
    );
  };

  return {
    showVerificationRequiredNotification,
    showVerificationErrorNotification
  };
}
