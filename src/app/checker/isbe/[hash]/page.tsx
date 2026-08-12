'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface IsbeCheckResult {
  hash: string;
  exists: boolean;
  timestamp: number | null;
}

export default function IsbeCheckerPage() {
  const params = useParams<{ hash: string }>();
  const hash = decodeURIComponent(params.hash);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IsbeCheckResult | null>(null);

  useEffect(() => {
    if (!hash) return;
    let cancelled = false;

    fetch(`/api/checker/isbe/${encodeURIComponent(hash)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
        return body as IsbeCheckResult;
      })
      .then((body) => {
        if (!cancelled) setResult(body);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hash]);

  return (
    <div className="customer-container">
      <div className="customer-content">
        <div className="scan-section">
          <div className="scan-card" style={{ maxWidth: 540 }}>
            <div className="scan-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2>Certificación ISBE</h2>

            {loading && <p>Comprobando el hash en ISBE...</p>}

            {!loading && error && (
              <p style={{ color: '#ef4444' }}>{error}</p>
            )}

            {!loading && !error && result && (
              <>
                <p style={{ color: result.exists ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {result.exists ? 'Hash confirmado en ISBE' : 'ISBE aún no ha confirmado este hash'}
                </p>
                <div style={{ textAlign: 'left', wordBreak: 'break-all', marginTop: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Hash:</strong> {result.hash}
                  </div>
                  {result.timestamp && (
                    <div>
                      <strong>Timestamp:</strong> {new Date(result.timestamp * 1000).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="customer-footer">
        <p>&copy; 2026 certypass - Verificador ISBE</p>
      </div>
    </div>
  );
}
