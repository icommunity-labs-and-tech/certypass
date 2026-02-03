'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ItemData } from '../types';
import { EvidenceVerification } from './EvidenceVerification';
import { AntifraudPanel } from './AntifraudPanel';
import GeolocationMap from '@/components/GeolocationMapClient';
import { extractGeolocationField } from '@/lib/template-helpers';

// Estilos críticos para el pasaporte
const passportStyles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    borderRadius: '8px',
    color: '#64748b',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  },
  itemHeader: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: '0',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  itemInfo: {
    flex: '1',
  },
  itemTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 0.5rem',
  },
  itemDescription: {
    color: '#64748b',
    margin: '0 0 1rem',
    lineHeight: '1.5',
  },
  itemMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    borderBottom: '1px solid #e2e8f0',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  },
  tabActive: {
    color: '#3b82f6',
  },
  tabContent: {
    minHeight: '200px',
  },
  infoSection: {
    marginBottom: '2rem',
  },
  infoSectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1rem',
  },
  infoGrid: {
    display: 'grid',
    gap: '1rem',
  },
  infoItem: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    alignItems: 'start',
    columnGap: '1.5rem',
    rowGap: '0.25rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  infoItemMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  label: {
    fontWeight: '500',
    color: '#64748b',
    paddingTop: '0.125rem',
  },
  value: {
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: '1.6',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  } as CSSProperties,
  status: {
    fontWeight: '600',
  },
};

interface ItemPassportProps {
  item: ItemData;
  onBack: () => void;
}

export function ItemPassport({ item, onBack }: ItemPassportProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'antifraud'>('info');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} · ${timeStr}`;
  }, []);

  // Detectar layout móvil
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // getStatusColor removed - not currently used

  const hasHistory = useMemo(() => 
    item.states && item.states.length > 0, 
    [item.states]
  );

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/customer');
    }
  };

  const renderInfoSection = () => (
    <div>
      <div style={passportStyles.infoSection}>
        <h4 style={passportStyles.infoSectionTitle}>Detalles del Producto</h4>
        <div style={passportStyles.infoGrid}>
          <div style={isMobile ? passportStyles.infoItemMobile : passportStyles.infoItem}>
            <span style={passportStyles.label}>Categoría:</span>
            <span style={passportStyles.value}>{item.category?.name || 'N/A'}</span>
          </div>
        </div>
      </div>

      {item.templateFields && Object.keys(item.templateFields).length > 0 && (
        <div style={passportStyles.infoSection}>
          <h4 style={passportStyles.infoSectionTitle}>Especificaciones</h4>
          <div style={passportStyles.infoGrid}>
            {Object.entries(item.templateFields).map(([key, value]: [string, any]) => {
              // Check if value is a geolocation object
              const isGeolocation = value && 
                typeof value === 'object' && 
                !Array.isArray(value) &&
                'lat' in value && 
                'lng' in value &&
                typeof value.lat === 'number' &&
                typeof value.lng === 'number';

              return (
                <div key={key} style={isMobile ? passportStyles.infoItemMobile : passportStyles.infoItem}>
                  <span style={passportStyles.label}>{key}:</span>
                  <span style={passportStyles.value}>
                    {isGeolocation ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <GeolocationMap 
                          value={{ lat: value.lat, lng: value.lng }} 
                          readOnly={true} 
                        />
                      </div>
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verificación de evidencia del producto */}
      {item.evidenceID && (
        <div style={passportStyles.infoSection}>
          <h4 style={passportStyles.infoSectionTitle}>Certificación del producto</h4>
          <EvidenceVerification 
            evidenceId={item.evidenceID} 
            type="item" 
            entityId={item.id}
            createdAt={item.createdAt}
            createdBy={item.createdBy}
          />
        </div>
      )}
    </div>
  );

  const renderAntifraudSection = () => (
    <div>
      <AntifraudPanel item={item} />
    </div>
  );

  const renderHistorySection = () => (
    <div>
      {hasHistory ? (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          <div style={{
            position: 'absolute',
            left: '0.75rem',
            top: '0',
            bottom: '0',
            width: '2px',
            background: '#e2e8f0'
          }}></div>
          {item.states?.map((state) => (
            <div key={state.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div style={{
                position: 'absolute',
                left: '-2rem',
                top: '0.25rem',
                width: '1rem',
                height: '1rem',
                background: '#3b82f6',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 0 0 2px #e2e8f0'
              }}></div>
              <div
                style={{
                  position: 'relative',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '1rem',
                  paddingTop: '0.75rem',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                {/* Timestamp en esquina superior derecha */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.5rem',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderRadius: '4px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: '12px', height: '12px', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#1e40af' }}>
                    {formatDateTime(state.createdAt)}
                  </span>
                </div>

                <h5 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '120px' }}>
                  {state.title}
                  {state.evidenceID && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{
                        width: '1rem',
                        height: '1rem',
                        color: '#22c55e',
                        flexShrink: 0
                      }}
                      aria-label="Estado verificado en blockchain"
                    >
                      <title>Estado verificado en blockchain</title>
                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </h5>
                <p style={{ color: '#64748b', margin: '0 0 0.75rem', lineHeight: '1.5' }}>
                  {state.description}
                </p>

                {state.imageUrls && state.imageUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {state.imageUrls.map((url, index) => (
                      <img key={index} src={url} alt={`Evidencia ${index + 1}`} style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0'
                      }} />
                    ))}
                  </div>
                )}
                
                {/* Verificación de evidencia del estado */}
                {state.evidenceID && (
                  <EvidenceVerification 
                    evidenceId={state.evidenceID} 
                    type="state" 
                    entityId={state.id}
                    createdAt={state.createdAt}
                    createdBy={state.createdBy}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem',
            background: '#f1f5f9',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '2rem', height: '2rem' }}>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p style={{ fontSize: '1rem', margin: '0', lineHeight: '1.5' }}>No hay historial disponible para este producto</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={passportStyles.container}>
      <div style={passportStyles.header}>
        <button style={passportStyles.backButton} onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1rem', height: '1rem' }}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
        <h2 style={passportStyles.headerTitle}>Información del Producto</h2>
      </div>

      <div style={passportStyles.card}>
        {/* Item Header */}
        <div style={passportStyles.itemHeader}>
          <div style={passportStyles.itemImage}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={passportStyles.placeholderImage}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '2rem', height: '2rem' }}>
                  <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            )}
          </div>
          <div style={passportStyles.itemInfo}>
            <h3 style={{
              ...passportStyles.itemTitle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {item.name}
              {item.evidenceID && (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    color: '#22c55e',
                    flexShrink: 0
                  }}
                  aria-label="Producto verificado en blockchain"
                >
                  <title>Producto verificado en blockchain</title>
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </h3>
            <p style={passportStyles.itemDescription}>
              {item.description || t('noDescription')}
            </p>
            <div style={passportStyles.itemMeta}>
              <span>ID: {item.id}</span>
              <span>Creado: {formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (solo escritorio) */}
        {!isMobile && (
          <div style={passportStyles.tabs}>
            <button 
              style={{
                ...passportStyles.tab,
                ...(activeTab === 'info' ? passportStyles.tabActive : {})
              }}
              onClick={() => setActiveTab('info')}
            >
              Información
            </button>
            <button 
              style={{
                ...passportStyles.tab,
                ...(activeTab === 'history' ? passportStyles.tabActive : {})
              }}
              onClick={() => setActiveTab('history')}
            >
              Pasaporte Digital
            </button>
            <button 
              style={{
                ...passportStyles.tab,
                ...(activeTab === 'antifraud' ? passportStyles.tabActive : {})
              }}
              onClick={() => setActiveTab('antifraud')}
            >
              Antifalsificación
            </button>
          </div>
        )}

        {/* Tab / Mobile Content */}
        <div style={passportStyles.tabContent}>
          {isMobile ? (
            <>
              {renderInfoSection()}
              <div style={{ height: '1rem' }} />
              {renderHistorySection()}
              <div style={{ height: '1rem' }} />
              {renderAntifraudSection()}
            </>
          ) : (
            <>
              {activeTab === 'info' && renderInfoSection()}
              {activeTab === 'history' && renderHistorySection()}
              {activeTab === 'antifraud' && renderAntifraudSection()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
