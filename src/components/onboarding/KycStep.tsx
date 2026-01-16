'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { checkKycStatus } from '@/actions/organizations/check-kyc-status';

interface KycStepProps {
  organizationId: string;
  activationToken: string;
  kycURL: string | null;
  initialStatus: 'NOT_VERIFIED' | 'WAITING' | 'VERIFIED' | 'REJECTED';
  onVerified: () => void;
  onGoToLogin?: () => void;
}

export default function KycStep({
  organizationId,
  activationToken,
  kycURL,
  initialStatus,
  onVerified,
  onGoToLogin,
}: KycStepProps) {
  const [verificationStatus, setVerificationStatus] = useState<
    'NOT_VERIFIED' | 'WAITING' | 'VERIFIED' | 'REJECTED'
  >(initialStatus);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para verificar el estado del KYC (usando useCallback para estabilidad)
  const checkStatus = useCallback(async () => {
    try {
      const result = await checkKycStatus(organizationId);
      if (result.success && result.verificationStatus) {
        setVerificationStatus(result.verificationStatus);
        if (result.verificationStatus === 'VERIFIED') {
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (result.verificationStatus === 'REJECTED') {
          setIsPolling(false);
          setError('La verificación fue rechazada. Por favor, contacta con soporte.');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    }
  }, [organizationId]);

  // Verificar estado inicial al montar
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Verificar estado cuando la página vuelve a estar visible (el usuario regresa después del KYC)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && verificationStatus === 'WAITING') {
        // Verificar inmediatamente cuando el usuario vuelve a la página
        checkStatus();
      }
    };

    const handleFocus = () => {
      if (verificationStatus === 'WAITING') {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [verificationStatus, checkStatus]);

  // Verificar estado cuando la página vuelve a estar visible (el usuario regresa después del KYC)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && verificationStatus === 'WAITING') {
        // Verificar inmediatamente cuando el usuario vuelve a la página
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkStatus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkStatus);
    };
  }, [verificationStatus, organizationId]);

  // Iniciar/detener polling cuando el estado cambia a WAITING
  // El polling es un fallback, el webhook debería actualizar el estado primero
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Si el estado es WAITING, iniciar polling como fallback
    // El webhook debería actualizar el estado primero, pero el polling asegura
    // que detectemos cambios incluso si el webhook falla o hay retrasos
    if (verificationStatus === 'WAITING') {
      setIsPolling(true);
      // Polling menos frecuente (15 segundos) ya que confiamos en el webhook
      // El webhook de iCommunity actualizará el estado inmediatamente cuando aprueben
      pollingIntervalRef.current = setInterval(() => {
        checkStatus();
      }, 15000);
    } else {
      setIsPolling(false);
    }

    // Cleanup al desmontar o cuando cambia el estado
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [verificationStatus, checkStatus]);

  const handleOpenKyc = () => {
    if (kycURL) {
      window.open(kycURL, '_blank', 'noopener,noreferrer');
      // Si estaba en NOT_VERIFIED, cambiar a WAITING y empezar polling
      if (verificationStatus === 'NOT_VERIFIED') {
        setVerificationStatus('WAITING');
      }
    }
  };

  const handleContinue = () => {
    if (verificationStatus === 'VERIFIED') {
      onVerified();
    }
  };

  if (!kycURL) {
    return (
      <Alert variant="warning">
        <Alert.Heading>
          <i className="bi bi-exclamation-triangle me-2"></i>
          URL de verificación no disponible
        </Alert.Heading>
        <p>
          No se pudo generar la URL de verificación. Por favor, contacta con soporte para completar el proceso de verificación.
        </p>
      </Alert>
    );
  }

  return (
    <div>
      <div className="text-center mb-4">
        <i className="bi bi-shield-check text-primary" style={{ fontSize: '3rem' }}></i>
        <h3 className="mt-3 mb-2">Verificación de Identidad (Opcional)</h3>
        <p className="text-muted">
          La verificación de identidad es opcional. Puedes completarla ahora o más tarde desde tu perfil.
        </p>
        <Alert variant="warning" className="mt-3">
          <small>
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Importante:</strong> Necesitarás completar el KYC para crear items y estados certificados en blockchain.
          </small>
        </Alert>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body className="p-4">
          <div className="mb-3">
            <h5 className="mb-2">
              <i className="bi bi-info-circle me-2"></i>
              Estado de verificación
            </h5>
            <div className="d-flex align-items-center gap-2">
              {verificationStatus === 'NOT_VERIFIED' && (
                <>
                  <span className="badge bg-secondary">No iniciado</span>
                  <p className="mb-0 text-muted small">
                    Haz clic en el botón de abajo para iniciar el proceso de verificación
                  </p>
                </>
              )}
              {verificationStatus === 'WAITING' && (
                <>
                  <span className="badge bg-warning">En proceso</span>
                  {isPolling && (
                    <Spinner size="sm" className="ms-2" />
                  )}
                  <p className="mb-0 text-muted small">
                    Estamos verificando tu información. Esto puede tomar unos minutos.
                  </p>
                </>
              )}
              {verificationStatus === 'VERIFIED' && (
                <>
                  <span className="badge bg-success">Verificado</span>
                  <p className="mb-0 text-success small">
                    <i className="bi bi-check-circle me-1"></i>
                    Tu verificación ha sido completada exitosamente
                  </p>
                </>
              )}
              {verificationStatus === 'REJECTED' && (
                <>
                  <span className="badge bg-danger">Rechazado</span>
                  <p className="mb-0 text-danger small">
                    La verificación fue rechazada. Por favor, contacta con soporte.
                  </p>
                </>
              )}
            </div>
          </div>

          {verificationStatus !== 'VERIFIED' && (
            <div className="mb-3">
              <Button
                variant="primary"
                onClick={handleOpenKyc}
                className="w-100"
                disabled={verificationStatus === 'REJECTED'}
              >
                <i className="bi bi-box-arrow-up-right me-2"></i>
                {verificationStatus === 'NOT_VERIFIED'
                  ? 'Iniciar verificación'
                  : 'Abrir proceso de verificación'}
              </Button>
              <p className="text-muted small mt-2 mb-0">
                Se abrirá en una nueva ventana. Completa el proceso y vuelve aquí.
              </p>
              
              {/* Mostrar botón de ir al login cuando el proceso está en curso (WAITING) */}
              {verificationStatus === 'WAITING' && onGoToLogin && (
                <>
                  <div className="text-center my-3">
                    <small className="text-muted">o</small>
                  </div>
                  <Button
                    variant="outline-primary"
                    onClick={onGoToLogin}
                    className="w-100"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Ir al Login
                  </Button>
                  <p className="text-muted small mt-2 mb-0 text-center">
                    Si ya completaste el proceso de verificación, puedes ir al login
                  </p>
                </>
              )}
            </div>
          )}

          {verificationStatus === 'VERIFIED' && (
            <div className="d-flex flex-column gap-2">
              <Button
                variant="success"
                onClick={handleContinue}
                className="w-100"
                size="lg"
              >
                <i className="bi bi-check-circle me-2"></i>
                Continuar y Activar Cuenta
              </Button>
              {onGoToLogin && (
                <>
                  <div className="text-center my-2">
                    <small className="text-muted">o</small>
                  </div>
                  <Button
                    variant="outline-primary"
                    onClick={onGoToLogin}
                    className="w-100"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Ir al Login
                  </Button>
                  <p className="text-muted small mt-2 mb-0 text-center">
                    Si ya completaste el proceso de verificación, puedes ir directamente al login
                  </p>
                </>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <Alert variant="info" className="mb-0">
        <small>
          <i className="bi bi-lightbulb me-2"></i>
          <strong>Consejo:</strong> Ten a mano tu documentación oficial de la organización antes de comenzar.
        </small>
      </Alert>
    </div>
  );
}
