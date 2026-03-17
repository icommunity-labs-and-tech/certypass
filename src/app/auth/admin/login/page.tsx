'use client';

import { useState, useEffect, Suspense } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthSeparated, AuthProvider } from '@/hooks/useAuthSeparated';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Logo from '@/components/Logo';
import WorldMapSVG from '@/components/auth/WorldMapSVG';
import StepsSVG from '@/components/auth/StepsSVG';

const FLIP_MS = 3200; // flip card to form after steps animation completes

const cardStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(13,110,253,0.12)',
  border: '1px solid rgba(255,255,255,0.9)',
};

function AdminLoginContent() {
  const t = useTranslations('auth.login.admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const skip = searchParams.get('skip') === '1';
  const [flipped, setFlipped] = useState(skip);
  const { user, loading, login } = useAuthSeparated();

  useEffect(() => {
    if (user && !loading && user.role === 'ADMIN') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const e = searchParams.get('error');
    if (e === 'AccessDenied') setError(t('errors.accessDenied'));
    else if (e === 'Unauthorized') setError(t('errors.unauthorized'));
  }, [searchParams, t]);

  useEffect(() => {
    if (skip) return;
    const timer = setTimeout(() => setFlipped(true), FLIP_MS);
    return () => clearTimeout(timer);
  }, [skip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(email, password, 'admin');
      if (result.success) { router.push('/dashboard'); }
      else { setError(result.error || t('errors.invalidCredentials')); }
    } catch {
      setError(t('errors.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#e3e3e3' }}>

      {/* Full-screen city map — always visible */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <WorldMapSVG style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Flip card — left side */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem clamp(1rem, 4vw, 2rem) 2rem clamp(2rem, 8vw, 7rem)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', perspective: '1200px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '440px',
            transformStyle: 'preserve-3d',
            transition: skip ? 'none' : 'transform 0.8s cubic-bezier(0.77,0,0.175,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>

            {/* Front face: steps animation */}
            <div style={cardStyle}>
              <StepsSVG />
            </div>

            {/* Back face: login form */}
            <div style={{
              ...cardStyle,
              transform: 'rotateY(180deg)',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div className="mb-4">
                <Logo href="" width={130} height={43} />
              </div>

              <div className="mb-4">
                <h1 className="h4 fw-bold mb-1" style={{ color: '#0f172a' }}>
                  {t('subtitle')}
                </h1>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mb-3 py-2 small">
                    <i className="bi bi-exclamation-triangle me-2" />{error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="outline-primary"
                  className="w-100 mb-3"
                  disabled={isLoading}
                  style={{ fontWeight: 600, borderRadius: '10px' }}
                >
                  {isLoading ? (
                    <><Spinner animation="border" size="sm" className="me-2" />{t('accessing')}</>
                  ) : (
                    <><i className="bi bi-box-arrow-in-right me-2" />{t('access')}</>
                  )}
                </Button>
              </Form>

              <div className="text-center mt-auto">
                <small className="text-muted">
                  {t('operatorLink')}{' '}
                  <Link href="/auth/operator/login" className="text-decoration-none fw-medium">
                    {t('accessHere')}
                  </Link>
                </small>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const tCommon = useTranslations('common.actions');
  return (
    <AuthProvider>
      <Suspense fallback={
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" variant="primary">
            <span className="visually-hidden">{tCommon('loading')}</span>
          </Spinner>
        </div>
      }>
        <AdminLoginContent />
      </Suspense>
    </AuthProvider>
  );
}
