'use client';

import { Button, Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { getOrCreateKycUrl } from '@/actions/users/getOrCreateKycUrl';

interface VerificationBannerProps {
  variant?: 'warning' | 'danger' | 'info';
  className?: string;
  showActionButton?: boolean;
}

export default function VerificationBanner({ 
  variant = 'warning', 
  className = '', 
  showActionButton = true 
}: VerificationBannerProps) {
  const { user, loading } = useAuthSeparated();
  const [resolvingKyc, setResolvingKyc] = useState(false);
  const [resolvedKycUrl, setResolvedKycUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  // Si está cargando, no mostrar nada
  if (loading) {
    return null;
  }

  // Si no hay usuario o ya está verificado con signature ID, no mostrar nada
  if (!user || (user.verificationStatus === 'VERIFIED' && user.signatureID)) {
    return null;
  }

  const getMessage = () => {
    if (user.verificationStatus === 'NOT_VERIFIED') {
      return 'Para certificar evidencias automáticamente, necesitas verificar tu identidad y obtener una signature ID.';
    } else if (user.verificationStatus === 'VERIFIED' && !user.signatureID) {
      return 'Tu identidad está verificada pero necesitas una signature ID para certificar evidencias.';
    } else if (user.verificationStatus === 'WAITING') {
      return 'Tu verificación de identidad está en proceso. Podrás certificar evidencias una vez completada.';
    } else if (user.verificationStatus === 'REJECTED') {
      return 'Tu verificación de identidad fue rechazada. Contacta al administrador para resolver.';
    }
    return 'Para certificar evidencias automáticamente, necesitas completar tu verificación de identidad.';
  };

  const getVerificationLink = () => {
    if (user.verificationStatus === 'NOT_VERIFIED') {
      return resolvedKycUrl || user.kycURL || null;
    }
    return null;
  };

  const handleResolveKyc = async () => {
    if (!user) return;
    setResolvingKyc(true);
    setError(null);
    try {
      console.log('Intentando obtener KYC URL para usuario:', user.id);
      const res = await getOrCreateKycUrl(user.id);
      console.log('Respuesta de getOrCreateKycUrl:', res);
      
      if (res?.success && res.kycURL) {
        setResolvedKycUrl(res.kycURL);
        window.open(res.kycURL, '_blank');
      } else {
        const errorMsg = res?.error || 'No se pudo generar la URL de verificación';
        console.error('Error al obtener KYC URL:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error al llamar getOrCreateKycUrl:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setResolvingKyc(false);
    }
  };

  // getActionButton removed - not currently used

  // verificationLink removed - not currently used

  return (
    <>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <Alert.Heading><i className="bi bi-exclamation-triangle me-2"></i>Error de Verificación</Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      )}
      <div className={`alert alert-${variant} border-0 shadow-sm ${className}`} style={{
      background: variant === 'warning' 
        ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' 
        : variant === 'danger' 
        ? 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)' 
        : 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
      borderLeft: `4px solid ${variant === 'warning' ? '#ffc107' : variant === 'danger' ? '#dc3545' : '#17a2b8'}`
    }}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <div className="me-3" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: variant === 'warning' ? '#ffc107' : variant === 'danger' ? '#dc3545' : '#17a2b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            <i className="bi bi-shield-exclamation"></i>
          </div>
          <div>
            <h6 className="mb-1 fw-bold" style={{
              color: variant === 'warning' ? '#856404' : variant === 'danger' ? '#721c24' : '#0c5460'
            }}>
              Verificación de Usuario Requerida
            </h6>
            <p className="mb-0" style={{
              color: variant === 'warning' ? '#856404' : variant === 'danger' ? '#721c24' : '#0c5460',
              fontSize: '0.9rem'
            }}>
              {getMessage()}
            </p>
          </div>
        </div>
        
        <div>
          <Button
            variant="warning"
            size="sm"
            className="fw-semibold"
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              background: '#ffc107',
              border: '2px solid #e0a800',
              color: '#000',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onClick={() => {
              const link = getVerificationLink();
              if (link) {
                window.open(link, '_blank');
              } else {
                handleResolveKyc();
              }
            }}
            disabled={resolvingKyc}
          >
            <i className="bi bi-shield-check me-2"></i>
            {resolvingKyc ? 'Generando enlace…' : 'Verificar identidad'}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
