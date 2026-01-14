'use client';

import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface VerificationAlertProps {
  show?: boolean;
  className?: string;
  variant?: 'warning' | 'danger' | 'info';
}

export default function VerificationAlert({ 
  show = true, 
  className = '', 
  variant = 'warning' 
}: VerificationAlertProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return null;
  }

  // Si el usuario tiene signatureID y está verificado, no mostrar la alerta
  if (user?.signatureID && user?.verificationStatus === 'VERIFIED') {
    return null;
  }

  if (!show) {
    return null;
  }

  const getAlertContent = () => {
    if (!user?.signatureID) {
      return {
        title: '⚠️ Verificación de Identidad Requerida',
        message: 'Para certificar automáticamente los estados y evidencias, necesitas completar tu verificación de identidad.',
        actionText: 'Completar Verificación',
        actionLink: '/dashboard/profile#verificacion'
      };
    }

    if (user?.verificationStatus === 'WAITING') {
      return {
        title: '⏳ Verificación en Proceso',
        message: 'Tu verificación de identidad está siendo procesada. Los estados se certificarán automáticamente una vez completada.',
        actionText: 'Ver Estado',
        actionLink: '/dashboard/profile#verificacion'
      };
    }

    if (user?.verificationStatus === 'REJECTED') {
      return {
        title: '❌ Verificación Rechazada',
        message: 'Tu verificación de identidad fue rechazada. Contacta soporte para resolver el problema.',
        actionText: 'Contactar Soporte',
        actionLink: '/dashboard/profile#verificacion'
      };
    }

    return {
      title: '⚠️ Verificación Pendiente',
      message: 'Para certificar automáticamente los estados y evidencias, necesitas completar tu verificación de identidad.',
      actionText: 'Completar Verificación',
      actionLink: '/dashboard/profile#verificacion'
    };
  };

  const content = getAlertContent();

  return (
    <Alert variant={variant} className={`mb-4 ${className}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-2">{content.title}</h6>
          <p className="mb-3">{content.message}</p>
          <Button 
            variant={variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => router.push(content.actionLink)}
          >
            {content.actionText}
          </Button>
        </div>
        <div className="ms-3">
          <i className="bi bi-shield-exclamation fs-4"></i>
        </div>
      </div>
    </Alert>
  );
}
