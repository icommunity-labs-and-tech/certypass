'use client';

import { useEffect, useState } from 'react';

type EvidenceAsset = { name: string; url?: string; hash?: string; inline?: string };

type VerificationResult = {
  ok: boolean;
  expected?: string;
  actual?: string;
};

async function sha512Base64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-512', buf);
  const arr = Array.from(new Uint8Array(hash));
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

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
  const [assets, setAssets] = useState<EvidenceAsset[]>([]);
  const [results, setResults] = useState<Record<string, VerificationResult>>({});
  const [fileStatus, setFileStatus] = useState<Record<string, 'pending' | 'ok' | 'error'>>({});
  const [visibleCount, setVisibleCount] = useState(0);
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
        // Puede estar en cert.links.checker, data.data.links.checker, o data.links.checker
        const checkerUrlFromApi = cert?.links?.checker || 
                                  data?.data?.links?.checker || 
                                  data?.links?.checker ||
                                  null;
        
        // Log para debugging
        if (checkerUrlFromApi) {
          console.log('[EvidenceVerification] Found checker URL from API:', checkerUrlFromApi);
        } else {
          console.log('[EvidenceVerification] Checker URL not found in API response, using constructed URL');
          console.log('[EvidenceVerification] Available paths checked:', {
            'cert.links.checker': !!cert?.links?.checker,
            'data.data.links.checker': !!data?.data?.links?.checker,
            'data.links.checker': !!data?.links?.checker,
            'cert.links': cert?.links,
            'data.data.links': data?.data?.links,
            'data.links': data?.links,
          });
        }
        
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

        // Mapear activos/archivos
        const filesByName = new Map<string, EvidenceAsset>();
        const d = data?.data || {};
        const integrity: any[] = d?.payload?.integrity || [];
        
        for (const f of integrity) {
          const name: string = f?.name || 'archivo';
          const hash: string | undefined = f?.checksum;
          const prev: EvidenceAsset = filesByName.get(name) || { name };
          filesByName.set(name, { ...prev, hash: hash || prev.hash });
        }

        // Añadir assets locales
        const localAssets: any[] = Array.isArray(data?.localAssets) ? data.localAssets : [];
        for (const a of localAssets) {
          const nm = a?.name || 'archivo';
          const prev: EvidenceAsset = filesByName.get(nm) || { name: nm };
          filesByName.set(nm, {
            ...prev,
            url: a?.url || prev.url,
            inline: a?.inline ?? prev.inline,
          });
        }

        // Incluir metadata si viene embebida
        if (d?.metadata && !filesByName.has('metadata.json')) {
          const metaStr = JSON.stringify(d.metadata, null, 2);
          const metaBlob = new Blob([metaStr], { type: 'application/json' });
          const metaUrl = URL.createObjectURL(metaBlob);
          filesByName.set('metadata.json', { name: 'metadata.json', url: metaUrl });
        }

        setAssets(Array.from(filesByName.values()));
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

  // Verificación automática de archivos
  useEffect(() => {
    if (assets.length === 0) return;

    // Animación de aparición secuencial
    setVisibleCount(0);
    const reveal = (i: number) => {
      setVisibleCount(i + 1);
      if (i + 1 < assets.length) setTimeout(() => reveal(i + 1), 200);
    };
    setTimeout(() => reveal(0), 150);

    const init: Record<string, 'pending' | 'ok' | 'error'> = {};
    assets.forEach((a) => {
      init[a.name] = 'pending';
    });
    setFileStatus(init);
    const next: Record<string, VerificationResult> = {};

    (async () => {
      for (const a of assets) {
        try {
          let blob: Blob | null = null;
          if (a.inline != null) {
            blob = new Blob([a.inline], { type: 'application/json' });
          } else if (a.url) {
            const res = await fetch(a.url);
            if (!res.ok) {
              next[a.name] = { ok: false, expected: a.hash, actual: `HTTP ${res.status}` };
              setFileStatus((s) => ({ ...s, [a.name]: 'error' }));
              continue;
            }
            blob = await res.blob();
          } else {
            next[a.name] = { ok: false, expected: a.hash, actual: 'sin contenido' };
            setFileStatus((s) => ({ ...s, [a.name]: 'error' }));
            continue;
          }

          const h = await sha512Base64(blob);
          const expected = a.hash;
          const normalize = (s?: string) => (s || '').replace(/\s+/g, '');
          const ok = expected ? normalize(h) === normalize(expected) : true;
          next[a.name] = { ok, expected, actual: h };
          setFileStatus((s) => ({ ...s, [a.name]: ok ? 'ok' : 'error' }));
        } catch {
          next[a.name] = { ok: false, expected: a.hash, actual: 'error' };
          setFileStatus((s) => ({ ...s, [a.name]: 'error' }));
        }
      }
      setResults(next);
    })();
  }, [assets]);

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
          ⚠️ No se pudo verificar la certificación
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
          {error}
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Sección: Firmante y Certificación blockchain */}
      {(createdBy || (majorNetwork && majorNetwork.url)) && (
        <div style={{ marginBottom: '1.5rem' }}>
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
                  minWidth: 0, // Necesario para que el ellipsis funcione en flex
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
      )}

      {/* Sección: Archivos */}
      {assets.length > 0 && (
        <div>
          <h6 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
            Archivos
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {assets.slice(0, visibleCount).map((a, idx) => {
              const status = fileStatus[a.name] || 'pending';
              // r removed - not currently used
              return (
                <div
                  key={a.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(209, 250, 229, 0.4)',
                    animation: `fadeInUp 0.4s ease-out both`,
                    animationDelay: `${idx * 0.1}s`,
                    minWidth: 0, // Necesario para que el ellipsis funcione en flex
                  }}
                >
                  {status === 'pending' && (
                    <svg viewBox="0 0 24 24" width="14" height="14" className="animate-spin" style={{ color: '#3b82f6', flexShrink: 0 }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                  {status === 'ok' && (
                    <svg viewBox="0 0 24 24" width="14" height="14" style={{ color: '#10b981', flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                  {status === 'error' && (
                    <svg viewBox="0 0 24 24" width="14" height="14" style={{ color: '#ef4444', flexShrink: 0 }}>
                      <path d="M15 9l-6 6M9 9l6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      color: '#1e293b',
                      flex: 1,
                      minWidth: 0, // Crítico para que el ellipsis funcione en flex
                    }}
                    title={a.name} // Tooltip con el nombre completo
                  >
                    {a.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

