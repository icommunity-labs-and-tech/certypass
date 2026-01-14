'use client';

import { useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';

interface AIFillButtonProps {
  itemName: string;
  itemDescription: string;
  fields: Array<{ name: string; label: string; type: string }>;
  onDataFilled: (data: Record<string, any>) => void;
  className?: string;
}

export default function AIFillButton({
  itemName,
  itemDescription,
  fields,
  onDataFilled,
  className = ''
}: AIFillButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAIFill = async () => {
    if (!itemName.trim()) {
      setError('El nombre del item es requerido para usar la IA');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/ai/fill-item-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: itemName.trim(),
          itemDescription: itemDescription?.trim() || '',
          fields: fields
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la solicitud');
      }

      if (result.success && result.data) {
        // Filtrar campos vacíos y aplicar los datos
        const validData = Object.entries(result.data).reduce((acc, [key, value]) => {
          if (value && value.toString().trim() !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        if (Object.keys(validData).length > 0) {
          onDataFilled(validData);
          setSuccess(result.message || `Se completaron ${Object.keys(validData).length} campos`);
        } else {
          setError('La IA no pudo encontrar información específica para este item');
        }
      } else {
        throw new Error('No se recibieron datos válidos de la IA');
      }
    } catch (err) {
      console.error('AI Fill Error:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con la IA');
    } finally {
      setIsLoading(false);
    }
  };

  const canUseAI = itemName.trim() && fields.length > 0;

  return (
    <div className={`ai-fill-container ${className}`}>
      <Button
        variant="outline-primary"
        onClick={handleAIFill}
        disabled={isLoading || !canUseAI}
        className="d-flex align-items-center gap-2"
      >
        {isLoading ? (
          <>
            <Spinner animation="border" size="sm" />
            Consultando IA...
          </>
        ) : (
          <>
            <i className="bi bi-robot"></i>
            Rellenar con IA
          </>
        )}
      </Button>

      {!canUseAI && (
        <small className="text-muted d-block mt-1">
          {!itemName.trim() ? 'Completa el nombre del item para usar IA' : 'No hay campos específicos para rellenar'}
        </small>
      )}

      {error && (
        <Alert variant="danger" className="mt-2 mb-0 py-2">
          <small>{error}</small>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mt-2 mb-0 py-2">
          <small>{success}</small>
        </Alert>
      )}
    </div>
  );
}
