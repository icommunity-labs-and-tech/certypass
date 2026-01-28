'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ItemData } from '../types';

interface AntifraudPanelProps {
  item: ItemData;
}

interface EvidenceDetails {
  verificationDate?: string;
  evidenceDate?: string;
  ipAddress?: string;
  userAgent?: string;
  loading: boolean;
  error?: string;
}

export function AntifraudPanel({ item }: AntifraudPanelProps) {
  const t = useTranslations('customer');
  const [evidenceDetails, setEvidenceDetails] = useState<EvidenceDetails>({ loading: false });
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detectar layout móvil
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getIbsUrl = (evidenceId: string) => {
    return `https://checker.icommunitylabs.com/lookup/${evidenceId}`;
  };

  // Fetch evidence details from our API
  useEffect(() => {
    if (!item.antifraudEvidenceId || item.antifraudEvidenceId === 'NO_SIGNATURE') {
      return;
    }

    const fetchEvidenceDetails = async () => {
      setEvidenceDetails({ loading: true });
      try {
        const evidenceId = item.antifraudEvidenceId!;
        console.log('[AntifraudPanel] Fetching evidence details for:', evidenceId);
        const response = await fetch(`/api/customer/antifraud-evidence/${encodeURIComponent(evidenceId)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[AntifraudPanel] API error:', response.status, errorData);
          throw new Error(errorData.error || `Error ${response.status}: No se pudo obtener la evidencia`);
        }
        
        const data = await response.json();
        console.log('[AntifraudPanel] Evidence details received:', data);

        setEvidenceDetails({
          verificationDate: data.verificationDate,
          evidenceDate: data.evidenceDate,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          loading: false,
        });
      } catch (error) {
        console.error('[AntifraudPanel] Error fetching evidence details:', error);
        setEvidenceDetails({
          loading: false,
          error: error instanceof Error ? error.message : t('errorLoadingEvidence'),
        });
      }
    };

    fetchEvidenceDetails();
  }, [item.antifraudEvidenceId]);

  const passportStyles = {
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
    label: {
      fontWeight: '500',
      color: '#64748b',
      fontSize: '0.875rem',
    },
    value: {
      color: '#1e293b',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    statusCard: {
      padding: '1.5rem',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      background: 'transparent',
    },
    statusCardSuccess: {
      background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      border: '2px solid #059669',
    },
    statusCardWarning: {
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      border: '2px solid #f59e0b',
    },
    statusIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
    statusIconSuccess: {
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#059669',
    },
    statusIconWarning: {
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#d97706',
    },
    statusTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      margin: '0 0 0.5rem',
    },
    statusTitleSuccess: {
      color: '#065f46',
    },
    statusTitleWarning: {
      color: '#92400e',
    },
    statusText: {
      fontSize: '0.875rem',
      lineHeight: '1.6',
      margin: '0 0 1rem',
    },
    statusTextSuccess: {
      color: '#047857',
    },
    statusTextWarning: {
      color: '#78350f',
    },
    evidenceLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#1e293b',
      textDecoration: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      border: '1px solid rgba(0, 0, 0, 0.1)',
    },
    warningText: {
      background: 'rgba(245, 158, 11, 0.1)',
      padding: '0.625rem 0.875rem',
      borderRadius: '6px',
      color: '#92400e',
      fontSize: '0.8125rem',
      lineHeight: '1.5',
      marginTop: '1.5rem',
      fontWeight: '400',
    },
    evidenceDetails: {
      marginTop: '1.5rem',
    },
    evidenceDetailsTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 1rem',
    },
    evidenceDetailsItem: {
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      alignItems: 'start',
      columnGap: '1.5rem',
      rowGap: '0.25rem',
      padding: '0.75rem 0',
      borderBottom: '1px solid #f1f5f9',
    },
    evidenceDetailsItemMobile: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
      gap: '0.5rem',
      padding: '0.75rem 0',
      borderBottom: '1px solid #f1f5f9',
    },
    evidenceDetailsItemLast: {
      borderBottom: 'none',
    },
    evidenceDetailsLabel: {
      fontWeight: '500',
      color: '#64748b',
      fontSize: '0.875rem',
      paddingTop: '0.125rem',
    },
    evidenceDetailsValue: {
      color: '#1e293b',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.6',
      wordBreak: 'break-word',
    } as React.CSSProperties,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderEvidenceDetails = () => {
    if (!item.antifraudEvidenceId || item.antifraudEvidenceId === 'NO_SIGNATURE') {
      return null;
    }

    if (evidenceDetails.loading) {
      return (
        <div style={passportStyles.evidenceDetails}>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Cargando información...</div>
        </div>
      );
    }

    if (evidenceDetails.error) {
      return null; // Silently fail, don't show error
    }

    return (
      <div style={passportStyles.evidenceDetails}>
        <div style={passportStyles.infoGrid}>
          {evidenceDetails.verificationDate && (
            <div style={isMobile ? passportStyles.evidenceDetailsItemMobile : passportStyles.evidenceDetailsItem}>
              <span style={passportStyles.evidenceDetailsLabel}>Fecha de registro:</span>
              <span style={passportStyles.evidenceDetailsValue}>
                {formatDate(evidenceDetails.verificationDate)}
              </span>
            </div>
          )}
          {evidenceDetails.evidenceDate && (
            <div style={{ 
              ...(isMobile ? passportStyles.evidenceDetailsItemMobile : passportStyles.evidenceDetailsItem), 
              ...passportStyles.evidenceDetailsItemLast 
            }}>
              <span style={passportStyles.evidenceDetailsLabel}>Fecha de la evidencia:</span>
              <span style={passportStyles.evidenceDetailsValue}>
                {formatDate(evidenceDetails.evidenceDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (item.isFirstVerification) {
    return (
      <div>
        <div style={passportStyles.infoSection}>
          <div
            style={{
              ...passportStyles.statusCard,
              ...passportStyles.statusCardSuccess,
            }}
          >
            <div
              style={{
                ...passportStyles.statusIcon,
                ...passportStyles.statusIconSuccess,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.5rem', height: '1.5rem' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h5
              style={{
                ...passportStyles.statusTitle,
                ...passportStyles.statusTitleSuccess,
              }}
            >
              ✓ Producto Original Verificado
            </h5>
            <p
              style={{
                ...passportStyles.statusText,
                ...passportStyles.statusTextSuccess,
              }}
            >
              Este es el primer registro de este producto en nuestro sistema.
              certypass garantiza la autenticidad de este artículo.
            </p>
            {item.antifraudEvidenceId && item.antifraudEvidenceId !== 'NO_SIGNATURE' && (
              <a
                href={getIbsUrl(item.antifraudEvidenceId)}
                target="_blank"
                rel="noopener noreferrer"
                style={passportStyles.evidenceLink}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1rem', height: '1rem' }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
                {t('viewEvidence')}
              </a>
            )}
            {renderEvidenceDetails()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={passportStyles.infoSection}>
        <div style={passportStyles.statusCard}>
          <h5
            style={{
              ...passportStyles.statusTitle,
              color: '#1e293b',
              marginBottom: '1rem',
            }}
          >
            {t('verificationInfo')}
          </h5>
          <div
            style={{
              ...passportStyles.statusText,
              color: '#64748b',
              fontSize: '0.9375rem',
              lineHeight: '1.7',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: '0 0 1rem 0' }}>
              {t('previouslyRegistered')}
            </p>
            <p style={{ margin: '0 0 1rem 0' }}>
              <strong>{t('verificationFlow')}</strong> {t('verificationFlowDescription')}
            </p>
            <p style={{ margin: '0' }}>
              {t('alreadyVerified')}
            </p>
          </div>
          {item.antifraudEvidenceId && item.antifraudEvidenceId !== 'NO_SIGNATURE' && (
            <a
              href={getIbsUrl(item.antifraudEvidenceId)}
              target="_blank"
              rel="noopener noreferrer"
              style={passportStyles.evidenceLink}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1rem', height: '1rem' }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              {t('viewEvidence')}
            </a>
          )}
          {renderEvidenceDetails()}
          <div style={passportStyles.warningText}>
            {t('verificationWarning')}
          </div>
        </div>
      </div>
    </div>
  );
}

