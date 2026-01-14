import { useEffect } from 'react';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { publishWarningNotification, publishErrorNotification } from '@/lib/notificationEvents';

interface UseAdminVerificationNotificationProps {
  showNotification?: boolean;
  notificationType?: 'warning' | 'error';
  customMessage?: string;
  context?: string;
}

export function useAdminVerificationNotification({
  showNotification = true,
  notificationType = 'warning',
  customMessage,
  context = 'creación de items'
}: UseAdminVerificationNotificationProps = {}) {
  const { user } = useAuthSeparated();

  useEffect(() => {
    // Solo mostrar notificación si el usuario es admin y no está completamente verificado
    if (!user || user.role !== 'ADMIN') {
      return;
    }

    if (user.verificationStatus === 'VERIFIED' && user.signatureID) {
      return;
    }

    if (!showNotification) return;

    const getMessage = () => {
      if (customMessage) return customMessage;

      if (user.verificationStatus === 'NOT_VERIFIED') {
        return `Para certificar automáticamente la ${context}, necesitas verificar tu identidad y obtener una signature ID. Completa el proceso KYC en tu perfil.`;
      } else if (user.verificationStatus === 'VERIFIED' && !user.signatureID) {
        return `Tu identidad está verificada pero necesitas una signature ID para certificar la ${context}. Contacta al administrador.`;
      } else if (user.verificationStatus === 'WAITING') {
        return `Tu verificación de identidad está en proceso. Podrás certificar la ${context} una vez completada.`;
      } else if (user.verificationStatus === 'REJECTED') {
        return `Tu verificación de identidad fue rechazada. Contacta al administrador para resolver y poder certificar la ${context}.`;
      }
      
      return `Para certificar automáticamente la ${context}, necesitas completar tu verificación de identidad.`;
    };

    const message = getMessage();
    
    if (notificationType === 'error') {
      publishErrorNotification(
        '⚠️ Verificación de Firma Requerida',
        message
      );
    } else {
      publishWarningNotification(
        '⚠️ Verificación de Firma Requerida',
        message
      );
    }
  }, [user, showNotification, notificationType, customMessage, context]);

  const showVerificationRequiredNotification = (operationContext: string = 'creación de items') => {
    if (!user || user.role !== 'ADMIN') return;
    if (user.verificationStatus === 'VERIFIED' && user.signatureID) return;

    publishWarningNotification(
      '⚠️ Verificación Requerida',
      `Para ${operationContext}, necesitas completar tu proceso de verificación de identidad (KYC).`
    );
  };

  const isVerified = user?.verificationStatus === 'VERIFIED' && !!user?.signatureID && user?.role === 'ADMIN';

  return {
    isVerified,
    verificationStatus: user?.verificationStatus,
    hasSignatureID: !!user?.signatureID,
    showVerificationRequiredNotification,
    isAdmin: user?.role === 'ADMIN',
  };
}

