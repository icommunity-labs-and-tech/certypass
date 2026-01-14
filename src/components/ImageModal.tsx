'use client';

import { Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';

interface ImageModalProps {
  show: boolean;
  onHide: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
}

export default function ImageModal({ show, onHide, imageUrl, alt, title }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (show && imageUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [show, imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      className="image-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title || 'Imagen'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 d-flex justify-content-center align-items-center">
        {isLoading && (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando imagen...</span>
            </div>
          </div>
        )}
        
        {hasError ? (
          <div className="d-flex flex-column justify-content-center align-items-center text-muted" style={{ minHeight: '400px' }}>
            <i className="bi bi-image" style={{ fontSize: '3rem' }}></i>
            <p className="mt-2 mb-0">Error al cargar la imagen</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={alt}
            className="img-fluid"
            style={{ 
              maxHeight: '70vh',
              width: 'auto',
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </Modal.Body>
      
      <style jsx>{`
        .image-modal .modal-dialog {
          max-width: 90vw;
        }
        
        .image-modal .modal-body {
          background-color: #f8f9fa;
          border-radius: 0 0 0.375rem 0.375rem;
          min-height: 400px;
        }
        
        .image-modal img {
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: auto;
        }
      `}</style>
    </Modal>
  );
}
