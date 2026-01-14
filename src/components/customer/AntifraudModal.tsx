'use client';

import React from 'react';
import './antifraud.css';

interface AntifraudModalProps {
  isFirstVerification: boolean;
  evidenceID?: string;
  onClose: () => void;
}

export function AntifraudModal({ isFirstVerification, onClose }: AntifraudModalProps) {
  // Solo mostrar modal en primera verificación
  if (!isFirstVerification) {
    return null;
  }

  return (
    <div className="antifraud-modal-overlay" onClick={onClose}>
      <div className="antifraud-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="antifraud-modal-success">
          <div className="antifraud-modal-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>✓ Producto Original Verificado</h2>
          <p>
            Este es el primer registro de este producto en nuestro sistema.
            certypass garantiza la autenticidad de este artículo.
          </p>
          <button className="antifraud-modal-button" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

