'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SignerBadge, BlockchainLink } from './ui';

interface IsbeVerificationProps {
  hash: string;
  createdBy?: { name: string; email: string } | null;
}

export function IsbeVerification({ hash, createdBy }: IsbeVerificationProps) {
  const t = useTranslations('customer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!hash) return;
    let cancelled = false;

    fetch(`/api/checker/isbe/${encodeURIComponent(hash)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
        return body as { exists: boolean };
      })
      .then((body) => {
        if (!cancelled) setConfirmed(!!body.exists);
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

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" className="animate-spin" style={{ color: '#3b82f6' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{t('verifyingIsbeCertification')}</p>
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
          {t('certificationError')}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.5rem',
      }}>
        {createdBy && <SignerBadge name={createdBy.name} />}
        <BlockchainLink
          href={`/checker/isbe/${encodeURIComponent(hash)}`}
          label={confirmed ? t('isbeCertification') : t('isbeCertificationPending')}
        />
      </div>
    </div>
  );
}
