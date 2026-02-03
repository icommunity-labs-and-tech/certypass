'use client';

import { useEffect, useState } from 'react';

interface EvidenceVerificationProps {
  evidenceId: string;
  type: 'item' | 'state';
  entityId: string;
  createdAt?: string;
  createdBy?: { name: string; email: string } | null;
}

export function EvidenceVerification({ evidenceId, type, entityId, createdAt: _createdAt, createdBy }: EvidenceVerificationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [majorNetwork, setMajorNetwork] = useState<{ name: string; url?: string } | null>(null);

  useEffect(() => {
    if (!evidenceId) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const endpoint = type === 'item'
      ? `/api/checker/item/${encodeURIComponent(entityId)}`
      : `/api/checker/${encodeURIComponent(entityId)}`;

    fetch(endpoint, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
          const errorMessage = errorData.error || `Error ${res.status}`;
          throw new Error(errorMessage);
        }
        return res.json();
      })
      .then((data) => {
        // Extraer información de la red blockchain principal (major) solamente
        const cert = data?.data?.certification || {};

        // Intentar obtener la URL del checker desde la respuesta de la API
        const checkerUrlFromApi = cert?.links?.checker ||
                                  data?.data?.links?.checker ||
                                  data?.links?.checker ||
                                  null;

        // Si no está en la API, construirla manualmente
        const checkerUrl = checkerUrlFromApi || `https://checker.icommunitylabs.com/lookup/${evidenceId}`;

        if (cert?.network) {
          setMajorNetwork({
            name: cert.network,
            url: checkerUrl,
          });
        } else {
          // Si no hay red principal, usar el checker
          setMajorNetwork({
            name: 'Blockchain',
            url: checkerUrl,
          });
        }
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          setError(e.message);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [evidenceId, type, entityId]);

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" className="animate-spin" style={{ color: '#3b82f6' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>Verificando evidencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        backgroundColor: 'rgba(254, 226, 226, 0.5)',
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          No se pudo verificar la certificación
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
          {error}
        </div>
      </div>
    );
  }

  // Si no hay nada que mostrar, no renderizar
  if (!createdBy && !majorNetwork?.url) {
    return null;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Sección: Firmante y Certificación blockchain */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.5rem',
      }}>
        {/* Tile del Firmante */}
        {createdBy && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(219, 234, 254, 0.3)',
              minWidth: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" style={{ color: '#3b82f6', flexShrink: 0 }} fill="currentColor">
              <title>Firmante</title>
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }} title={createdBy.name}>
              {createdBy.name}
            </div>
          </div>
        )}

        {/* Tile de Certificación blockchain */}
        {majorNetwork && majorNetwork.url && (
          <a
            href={majorNetwork.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.4), rgba(216, 180, 254, 0.4))',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              minWidth: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(233, 213, 255, 0.6), rgba(216, 180, 254, 0.6))';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(233, 213, 255, 0.4), rgba(216, 180, 254, 0.4))';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" style={{ color: '#7c3aed', flexShrink: 0 }} fill="currentColor">
              <title>Blockchain</title>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7c3aed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
              Certificación blockchain
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
