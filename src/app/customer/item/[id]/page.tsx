'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemPassport } from '../../components/ItemPassport';
import { AntifraudModal } from '@/components/customer/AntifraudModal';
import { ItemData } from '../../types';

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setItemId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/customer/item/${itemId}`);
        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }
        
        const data = await response.json();
        console.log('[Frontend] Item data received:', {
          id: data.id,
          antifraudEvidenceId: data.antifraudEvidenceId,
          isFirstVerification: data.isFirstVerification,
        });
        
        setItemData(data);
        
        // Show modal if first verification (only if evidence was just created)
        if (data.isFirstVerification && data.antifraudEvidenceId) {
          console.log('[Frontend] Showing first verification modal');
          setShowModal(true);
        } else if (data.isFirstVerification && !data.antifraudEvidenceId) {
          console.log('[Frontend] First verification but no evidence ID (NO_SIGNATURE case)');
          setShowModal(true);
        } else {
          console.log('[Frontend] Not first verification, modal will not show');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener datos del producto');
        setItemData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [itemId]);

  const handleBack = () => {
    router.push('/customer');
  };

  if (loading) {
    return (
      <div className="customer-container">
        <div className="customer-content">
          <div className="loading-section">
            <div className="loading-card">
              <div className="loading-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
              <h2>Cargando...</h2>
              <p>Obteniendo información del producto</p>
            </div>
          </div>
        </div>
        <div className="customer-footer">
          <p>&copy; 2026 CertyPass - Pasaporte Digital</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-container">
        <div className="customer-content">
          <div className="error-section">
            <div className="error-card">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              </div>
              <h3>Error</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => router.push('/customer')}>
                Volver al Scanner
              </button>
            </div>
          </div>
        </div>
        <div className="customer-footer">
          <p>&copy; 2026 CertyPass - Pasaporte Digital</p>
        </div>
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="customer-container">
        <div className="customer-content">
          <div className="error-section">
            <div className="error-card">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              </div>
              <h3>Producto no encontrado</h3>
              <p>No se pudo encontrar el producto solicitado</p>
              <button className="retry-button" onClick={() => router.push('/customer')}>
                Volver al Scanner
              </button>
            </div>
          </div>
        </div>
        <div className="customer-footer">
          <p>&copy; 2026 CertyPass - Pasaporte Digital</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-container">
      <div className="customer-content">
        <div className="passport-section">
          <ItemPassport item={itemData} onBack={handleBack} />
        </div>
      </div>
      
      {/* Show modal for first verification */}
      {showModal && itemData && (
        <AntifraudModal
          isFirstVerification={itemData.isFirstVerification}
          onClose={() => setShowModal(false)}
        />
      )}
      
      <div className="customer-footer">
        <p>&copy; 2026 CertyPass - Pasaporte Digital</p>
      </div>
    </div>
  );
}
