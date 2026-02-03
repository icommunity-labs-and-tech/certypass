'use client';

import { useEffect, useState } from 'react';
import { SignerBadge, BlockchainLink } from './ui';

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
        const cert = data?.data?.certification || {};
        const checkerUrlFromApi = cert?.links?.checker ||
                                  data?.data?.links?.checker ||
                                  data?.links?.checker ||
                                  null;
        const checkerUrl = checkerUrlFromApi || `https://checker.icommunitylabs.com/lookup/${evidenceId}`;

        if (cert?.network) {
          setMajorNetwork({ name: cert.network, url: checkerUrl });
        } else {
          setMajorNetwork({ name: 'Blockchain', url: checkerUrl });
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

  if (!createdBy && !majorNetwork?.url) {
    return null;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.5rem',
      }}>
        {createdBy && <SignerBadge name={createdBy.name} />}
        {majorNetwork?.url && <BlockchainLink href={majorNetwork.url} />}
      </div>
    </div>
  );
}
