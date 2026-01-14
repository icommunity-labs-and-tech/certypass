import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

interface CascadeInfo {
  statusTypesDeleted?: number;
  itemsDeleted?: number;
  statesDeleted?: number;
  statusTypeNames?: string[];
  itemNames?: string[];
  stateTitles?: string[];
}

interface DeleteConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  cascadeInfo?: CascadeInfo;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  show,
  onHide,
  onConfirm,
  title,
  message,
  cascadeInfo,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const hasCascade = cascadeInfo && Object.values(cascadeInfo).some(count => count && count > 0);

  const renderCascadeWarning = () => {
    if (!hasCascade) return null;

    const cascadeItems = [];
    
    
    // Tipos de estado
    if (cascadeInfo?.statusTypesDeleted && cascadeInfo.statusTypesDeleted > 0) {
      if (cascadeInfo.statusTypeNames && cascadeInfo.statusTypeNames.length > 0) {
        const displayNames = cascadeInfo.statusTypeNames.slice(0, 3);
        const remaining = cascadeInfo.statusTypesDeleted - displayNames.length;
        
        let text = displayNames.join(', ');
        if (remaining > 0) {
          text += ` y ${remaining} tipo${remaining !== 1 ? 's' : ''} de estado más`;
        }
        cascadeItems.push(text);
      } else {
        cascadeItems.push(`${cascadeInfo.statusTypesDeleted} tipo${cascadeInfo.statusTypesDeleted !== 1 ? 's' : ''} de estado`);
      }
    }
    
    // Items
    if (cascadeInfo?.itemsDeleted && cascadeInfo.itemsDeleted > 0) {
      if (cascadeInfo.itemNames && cascadeInfo.itemNames.length > 0) {
        const displayNames = cascadeInfo.itemNames.slice(0, 3);
        const remaining = cascadeInfo.itemsDeleted - displayNames.length;
        
        let text = displayNames.join(', ');
        if (remaining > 0) {
          text += ` y ${remaining} item${remaining !== 1 ? 's' : ''} más`;
        }
        cascadeItems.push(text);
      } else {
        cascadeItems.push(`${cascadeInfo.itemsDeleted} item${cascadeInfo.itemsDeleted !== 1 ? 's' : ''}`);
      }
    }
    
    // Estados
    if (cascadeInfo?.statesDeleted && cascadeInfo.statesDeleted > 0) {
      if (cascadeInfo.stateTitles && cascadeInfo.stateTitles.length > 0) {
        const displayNames = cascadeInfo.stateTitles.slice(0, 3);
        const remaining = cascadeInfo.statesDeleted - displayNames.length;
        
        let text = displayNames.join(', ');
        if (remaining > 0) {
          text += ` y ${remaining} estado${remaining !== 1 ? 's' : ''} más`;
        }
        cascadeItems.push(text);
      } else {
        cascadeItems.push(`${cascadeInfo.statesDeleted} estado${cascadeInfo.statesDeleted !== 1 ? 's' : ''}`);
      }
    }

    return (
      <Alert variant="warning" className="mt-3">
        <strong>⚠️ Atención:</strong> Esta acción también eliminará:
        <ul className="mb-0 mt-2">
          {cascadeItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Alert>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
        {renderCascadeWarning()}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Eliminando...
            </>
          ) : (
            'Eliminar'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
