'use client';

import { Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface WelcomeStepProps {
  userName: string;
  organizationName: string;
  onNext: () => void;
}

export default function WelcomeStep({
  userName,
  organizationName,
  onNext,
}: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="mb-4">
        <i className="bi bi-emoji-smile-fill text-primary" style={{ fontSize: '4rem' }}></i>
      </div>
      <h2 className="mb-3">¡Bienvenido a CertyPass!</h2>
      <p className="lead text-muted mb-4">
        Hola <strong>{userName}</strong>, estamos encantados de tenerte aquí.
      </p>
      
      <Card className="mb-4" style={{ backgroundColor: '#f8f9fa' }}>
        <Card.Body className="p-4">
          <h5 className="mb-3">
            <i className="bi bi-building me-2"></i>
            Organización: {organizationName}
          </h5>
          <p className="mb-0 text-muted">
            Estás a punto de completar la configuración inicial de tu cuenta como administrador.
          </p>
        </Card.Body>
      </Card>

      <div className="mb-4">
        <h5 className="mb-3">¿Qué sigue?</h5>
        <div className="d-flex flex-column gap-3 align-items-start" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="d-flex align-items-start w-100">
            <div className="me-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                1
              </div>
            </div>
            <div className="flex-grow-1 text-start">
              <strong>Establecer contraseña</strong>
              <p className="text-muted mb-0 small">
                Crea una contraseña segura para proteger tu cuenta
              </p>
            </div>
          </div>
          
          <div className="d-flex align-items-start w-100">
            <div className="me-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                2
              </div>
            </div>
            <div className="flex-grow-1 text-start">
              <strong>Verificación de identidad (KYC)</strong>
              <p className="text-muted mb-0 small">
                Completa el proceso de verificación para tu organización
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        className="px-5"
      >
        Comenzar
        <i className="bi bi-arrow-right ms-2"></i>
      </Button>
    </div>
  );
}
