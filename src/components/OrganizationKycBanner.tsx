'use client';

import { useState, useEffect } from 'react';
import { Alert, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getOrganizationKyc } from '@/actions/organizations/get-organization-kyc';

export default function OrganizationKycBanner() {
  const [kycInfo, setKycInfo] = useState<{
    verificationStatus: 'NOT_VERIFIED' | 'WAITING' | 'VERIFIED' | 'REJECTED';
    kycURL: string | null;
    organizationName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKycInfo = async () => {
      try {
        const result = await getOrganizationKyc();
        if (result.success && result.kycInfo) {
          setKycInfo(result.kycInfo);
        }
      } catch (error) {
        console.error('Error loading KYC info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKycInfo();
  }, []);

  // Solo mostrar el banner si el KYC no está verificado
  if (loading || !kycInfo || kycInfo.verificationStatus === 'VERIFIED') {
    return null;
  }

  const getVariant = () => {
    switch (kycInfo.verificationStatus) {
      case 'WAITING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      case 'NOT_VERIFIED':
      default:
        return 'info';
    }
  };

  const getMessage = () => {
    switch (kycInfo.verificationStatus) {
      case 'WAITING':
        return `La verificación de identidad (KYC) de tu organización "${kycInfo.organizationName}" está pendiente de aprobación.`;
      case 'REJECTED':
        return `La verificación de identidad (KYC) de tu organización "${kycInfo.organizationName}" fue rechazada. Por favor, reintenta el proceso.`;
      case 'NOT_VERIFIED':
      default:
        return `Tu organización "${kycInfo.organizationName}" aún no ha completado la verificación de identidad (KYC).`;
    }
  };

  const handleOpenKyc = () => {
    if (kycInfo.kycURL) {
      window.open(kycInfo.kycURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Alert variant={getVariant()} className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div className="d-flex align-items-center flex-grow-1">
        <i className={`bi bi-${kycInfo.verificationStatus === 'WAITING' ? 'clock' : kycInfo.verificationStatus === 'REJECTED' ? 'x-circle' : 'info-circle'}-fill me-2`}></i>
        <div>
          <Alert.Heading className="mb-1" style={{ fontSize: '1rem' }}>
            Verificación de Identidad Pendiente
          </Alert.Heading>
          <div style={{ fontSize: '0.875rem' }}>
            {getMessage()}
            <span className="ms-1">
              Necesitarás completar el KYC para crear items y estados certificados.
            </span>
          </div>
        </div>
      </div>
      {kycInfo.kycURL && (
        <Button
          variant={kycInfo.verificationStatus === 'REJECTED' ? 'danger' : 'primary'}
          size="sm"
          onClick={handleOpenKyc}
        >
          <i className="bi bi-box-arrow-up-right me-1"></i>
          {kycInfo.verificationStatus === 'WAITING' ? 'Ver Proceso' : 'Iniciar KYC'}
        </Button>
      )}
    </Alert>
  );
}
