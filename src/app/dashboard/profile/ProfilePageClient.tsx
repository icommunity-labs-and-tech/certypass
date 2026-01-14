'use client';

import { useState } from 'react';
import { Button, Badge, Row, Col, Card } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
// ObjectViewer removed - not currently used
import { formatValueWithSmartDateDetection } from '@/lib/format';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { retryVerification } from '@/actions/users';
// import { updateSigningPreference } from '@/actions/users';

export default function ProfilePageClient({ user }: { user: any }) {
  


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


      {/* Cambio de Contraseña */}
      <Box>
        <BoxTitle message='Cambio de contraseña'/>
        
        <p>Cambia tu contraseña para mantener la seguridad de tu cuenta</p>

        <ChangePasswordForm />
      </Box>

      {/* Oculto: se elimina la gestión de verificación/signature para el dashboard */}
    </>
  );
}

// Componente para el botón de reintentar verificación (no utilizado actualmente)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RetryVerificationButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRetry = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await retryVerification();
      
      if (result.success) {
        if ('kycURL' in result && result.kycURL) {
          setMessage({ type: 'success', text: 'Nueva URL de verificación generada. Redirigiendo...' });
          setTimeout(() => { window.location.href = result.kycURL!; }, 1500);
        } else {
          setMessage({ type: 'success', text: 'Verificación reintentada. Estado actualizado.' });
          setTimeout(() => { window.location.reload(); }, 1500);
        }
      } else {
        setMessage({ type: 'error', text: (result as any).error || 'Error al reintentar la verificación' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error inesperado al reintentar la verificación' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="primary" 
        size="sm" 
        onClick={handleRetry}
        disabled={isLoading}
        className="mb-2"
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Procesando...
          </>
        ) : (
          <>
            <i className="fas fa-redo me-1"></i>
            Reintentar Verificación
          </>
        )}
      </Button>
      
      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {message.text}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
    </div>
  );
}