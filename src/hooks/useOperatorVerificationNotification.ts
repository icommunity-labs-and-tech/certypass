'use client';

import { useEffect } from 'react';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { publishErrorNotification, publishWarningNotification } from '@/lib/notificationEvents';

interface UseOperatorVerificationNotificationProps {
  showNotification?: boolean;
  notificationType?: 'error' | 'warning';
  customMessage?: string;
  context?: string;
}

export function useOperatorVerificationNotification({
  showNotification = true,
  notificationType = 'warning',
  customMessage,
  context = 'operación'
}: UseOperatorVerificationNotificationProps = {}) {
  const { user } = useAuthSeparated();

  useEffect(() => {
    // Solo mostrar notificación si el usuario no está completamente verificado
    if (!user || (user.verificationStatus === 'VERIFIED' && user.signatureID)) {
      return;
    }

    if (!showNotification) return;

    const getMessage = () => {
      if (customMessage) return customMessage;

      if (user.verificationStatus === 'NOT_VERIFIED') {
        return `Para certificar automáticamente los estados y evidencias en la aplicación del operador, necesitas verificar tu identidad y obtener una signature ID. Completa el proceso KYC en tu perfil.`;
      } else if (user.verificationStatus === 'VERIFIED' && !user.signatureID) {
        return `Tu identidad está verificada pero necesitas una signature ID para certificar evidencias en la aplicación del operador. Contacta al administrador.`;
      } else if (user.verificationStatus === 'WAITING') {
        return `Tu verificación de identidad está en proceso. Podrás certificar evidencias en la aplicación del operador una vez completada.`;
      } else if (user.verificationStatus === 'REJECTED') {
        return `Tu verificación de identidad fue rechazada. Contacta al administrador para resolver y poder certificar evidencias.`;
      }
      
      return `Para certificar automáticamente los estados y evidencias en la aplicación del operador, necesitas completar tu verificación de identidad.`;
    };

    const message = getMessage();
    
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
  }, [user, showNotification, notificationType, customMessage, context]);

  const showVerificationRequiredNotification = (operationContext: string = 'operación') => {
    if (!showNotification || !user) return;

    const defaultMessage = `Para certificar automáticamente los estados y evidencias en la aplicación del operador, necesitas completar tu verificación de identidad. Completa el proceso KYC en tu perfil.`;
    
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
      `La ${customMessage || 'operación'} se completó correctamente, pero hubo un error al certificar en iCommunity desde la aplicación del operador. Puedes reintentar más tarde o contactar soporte.`
    );
  };

  return {
    showVerificationRequiredNotification,
    showVerificationErrorNotification
  };
}
