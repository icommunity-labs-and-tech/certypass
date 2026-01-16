'use client';

import { Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * Componente placeholder para el tutorial futuro
 * 
 * Este componente está preparado para integrar un tutorial interactivo
 * que guiará a los nuevos administradores a través de las funcionalidades
 * principales de CertyPass.
 * 
 * TODO: Implementar tutorial cuando se defina el contenido y la estructura
 */
interface TutorialStepProps {
  onComplete?: () => void;
}

export default function TutorialStep({ onComplete }: TutorialStepProps) {
  // Placeholder - el tutorial se implementará en el futuro
  return (
    <div className="text-center">
      <div className="mb-4">
        <i className="bi bi-book text-primary" style={{ fontSize: '3rem' }}></i>
      </div>
      <h3 className="mb-3">Tutorial</h3>
      <Card className="mb-4">
        <Card.Body className="p-4">
          <p className="text-muted">
            El tutorial interactivo estará disponible próximamente.
          </p>
          <p className="text-muted small mb-0">
            Aquí se mostrará una guía paso a paso sobre cómo usar CertyPass.
          </p>
        </Card.Body>
      </Card>
      {onComplete && (
        <button
          className="btn btn-primary"
          onClick={onComplete}
          style={{ display: 'none' }}
        >
          Omitir tutorial
        </button>
      )}
    </div>
  );
}
