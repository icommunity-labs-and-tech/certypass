'use client';

import { Badge, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
// ObjectViewer removed - not currently used
import { formatValueWithSmartDateDetection } from '@/lib/format';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { retryOrganizationKyc } from '@/actions/organizations/retry-organization-kyc';
import { useState } from 'react';
// import { updateSigningPreference } from '@/actions/users';

export default function ProfilePageClient({ user }: { user: any }) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [kycURL, setKycURL] = useState<string | null>(user?.Organization?.kycURL || null);

  const handleRetryKyc = async () => {
    setRetrying(true);
    setRetryError(null);
    
    try {
      const result = await retryOrganizationKyc();
      if (result.success) {
        if (result.kycURL) {
          setKycURL(result.kycURL);
          window.open(result.kycURL, '_blank', 'noopener,noreferrer');
        } else {
          setRetryError('No se pudo obtener una URL de verificación. Por favor, intenta más tarde.');
        }
      } else {
        setRetryError(result.error || 'Error al reintentar el KYC');
      }
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setRetrying(false);
    }
  };

  const handleOpenKyc = () => {
    if (kycURL) {
      window.open(kycURL, '_blank', 'noopener,noreferrer');
    }
  };
  


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'primary';
      case 'USER': return 'info';
      default: return 'secondary';
    }
  };

  // getVerificationBadgeVariant removed - not currently used
  // const getVerificationBadgeVariant = (status: string) => {
  //   switch (status) {
  //     case 'VERIFIED': return 'success';
  //     case 'WAITING': return 'warning';
  //     case 'REJECTED': return 'danger';
  //     case 'NOT_VERIFIED': return 'secondary';
  //     default: return 'secondary';
  //   }
  // };

  // getVerificationStatusText removed - not currently used
  // const getVerificationStatusText = (status: string) => {
  //   switch (status) {
  //     case 'VERIFIED': return 'Verificado';
  //     case 'WAITING': return 'En espera';
  //     case 'REJECTED': return 'Rechazado';
  //     case 'NOT_VERIFIED': return 'No verificado';
  //     default: return status;
  //   }
  // };

  return (
    <>
      {/* Información Personal */}
      <Box>
        <BoxTitle message='Información Personal'/>
        
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Body>
                <h6 className="card-title">Datos Básicos</h6>
                <div className="mb-2">
                  <strong>Nombre:</strong> {user.name || 'No especificado'}
                </div>
                <div className="mb-2">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="mb-2">
                  <strong>Teléfono:</strong> {user.phone || 'No especificado'}
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="mb-3">
              <Card.Body>
                <h6 className="card-title">Estado de la Cuenta</h6>
                <div className="mb-2">
                  <strong>Rol:</strong> {' '}
                  <Badge bg={getRoleBadgeVariant(user.role)}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </Badge>
                </div>
                
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {user.notes && (
          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title">Notas</h6>
              <p className="card-text">{user.notes}</p>
            </Card.Body>
          </Card>
        )}

        <Card className="mb-3">
          <Card.Body>
            <h6 className="card-title">Información de la Cuenta</h6>
            <div className="mb-2">
              <strong>Creada:</strong> {formatValueWithSmartDateDetection(user.createdAt, 'createdAt')}
            </div>
            <div className="mb-2">
              <strong>Última actualización:</strong> {formatValueWithSmartDateDetection(user.updatedAt, 'updatedAt')}
            </div>
          </Card.Body>
        </Card>
      </Box>


      {/* Verificación de Identidad (KYC) */}
      {user?.Organization && (
        <Box>
          <BoxTitle message='Verificación de Identidad (KYC)'/>
          
          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title">Estado de Verificación de la Organización</h6>
              <div className="mb-3">
                <strong>Organización:</strong> {user.Organization.nombre}
              </div>
              <div className="mb-3">
                <strong>Estado:</strong>{' '}
                <Badge 
                  bg={
                    user.Organization.verificationStatus === 'VERIFIED' ? 'success' :
                    user.Organization.verificationStatus === 'WAITING' ? 'warning' :
                    user.Organization.verificationStatus === 'REJECTED' ? 'danger' :
                    'secondary'
                  }
                >
                  {user.Organization.verificationStatus === 'VERIFIED' ? 'Verificado' :
                   user.Organization.verificationStatus === 'WAITING' ? 'En proceso' :
                   user.Organization.verificationStatus === 'REJECTED' ? 'Rechazado' :
                   'No verificado'}
                </Badge>
              </div>

              {user.Organization.verificationStatus !== 'VERIFIED' && (
                <>
                  <Alert variant={user.Organization.verificationStatus === 'REJECTED' ? 'danger' : 'warning'} className="mb-3">
                    <Alert.Heading>
                      <i className={`bi bi-${user.Organization.verificationStatus === 'REJECTED' ? 'x-circle' : 'clock'}-fill me-2`}></i>
                      {user.Organization.verificationStatus === 'REJECTED' 
                        ? 'Verificación Rechazada' 
                        : 'Verificación Pendiente'}
                    </Alert.Heading>
                    <p className="mb-0">
                      {user.Organization.verificationStatus === 'REJECTED'
                        ? 'La verificación de identidad fue rechazada. Por favor, revisa la información y reintenta el proceso.'
                        : 'La verificación de identidad está pendiente de aprobación. Esto puede tomar unos días.'}
                    </p>
                    {user.Organization.verificationStatus === 'WAITING' && (
                      <p className="mb-0 mt-2 small">
                        <i className="bi bi-info-circle me-1"></i>
                        El proceso de verificación está en revisión. Recibirás una notificación cuando se complete.
                      </p>
                    )}
                  </Alert>

                  <div className="d-flex gap-2 flex-wrap">
                    {kycURL && (
                      <Button
                        variant="primary"
                        onClick={handleOpenKyc}
                      >
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        {user.Organization.verificationStatus === 'WAITING' 
                          ? 'Ver Proceso de Verificación' 
                          : 'Abrir Proceso de Verificación'}
                      </Button>
                    )}
                    <Button
                      variant={user.Organization.verificationStatus === 'REJECTED' ? 'danger' : 'outline-primary'}
                      onClick={handleRetryKyc}
                      disabled={retrying}
                    >
                      {retrying ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Reintentando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Reintentar KYC
                        </>
                      )}
                    </Button>
                  </div>

                  {retryError && (
                    <Alert variant="danger" className="mt-3">
                      {retryError}
                    </Alert>
                  )}

                  <p className="text-muted small mt-3 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Necesitarás completar el KYC para crear items y estados certificados en blockchain.
                  </p>
                </>
              )}

              {user.Organization.verificationStatus === 'VERIFIED' && (
                <Alert variant="success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Tu organización está verificada. Ya puedes crear items y estados certificados.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Box>
      )}

      {/* Cambio de Contraseña */}
      <Box>
        <BoxTitle message='Cambio de contraseña'/>
        
        <p>Cambia tu contraseña para mantener la seguridad de tu cuenta</p>

        <ChangePasswordForm />
      </Box>

    </>
  );
}