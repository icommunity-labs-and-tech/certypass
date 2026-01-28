'use client';

import { useState, useEffect, Suspense } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthSeparated, AuthProvider } from '@/hooks/useAuthSeparated';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function AdminLoginContent() {
  const t = useTranslations('auth.login.admin');
  const tCommon = useTranslations('common.actions');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuthSeparated();

  // Redirigir si ya está autenticado como admin
  useEffect(() => {
    if (user && !loading && user.role === 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Mostrar error si viene de otra página
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'AccessDenied') {
      setError(t('errors.accessDenied'));
    } else if (errorParam === 'Unauthorized') {
      setError(t('errors.unauthorized'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password, 'admin');

      if (result.success) {
        setError(null);
        router.push('/dashboard');
      } else {
        setError(result.error || t('errors.invalidCredentials'));
      }
    } catch {
      setError(t('errors.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="admin-login">
        <Row className="vh-100 align-items-center justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{tCommon('loading')}</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container 
      fluid 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 50%, #581c87 100%)',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 85% 15%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 70% 80%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 25% 75%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 50% 45%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 90% 60%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 10% 55%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          radial-gradient(circle at 40% 25%, rgba(251, 191, 36, 0.4) 3px, transparent 3px),
          repeating-linear-gradient(0deg, rgba(139, 92, 246, 0.05) 0px, transparent 1px, transparent 50px, rgba(139, 92, 246, 0.05) 51px),
          repeating-linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0px, transparent 1px, transparent 50px, rgba(139, 92, 246, 0.05) 51px),
          linear-gradient(45deg, transparent 48%, rgba(251, 191, 36, 0.08) 49%, rgba(251, 191, 36, 0.08) 51%, transparent 52%),
          linear-gradient(-45deg, transparent 48%, rgba(251, 191, 36, 0.08) 49%, rgba(251, 191, 36, 0.08) 51%, transparent 52%),
          linear-gradient(135deg, #1e3a8a 0%, #4c1d95 50%, #581c87 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 50px 50px, 50px 50px, 120px 120px, 120px 120px, 100% 100%'
      }}
    >
      <Row className="vh-100 align-items-center justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card 
            className="shadow-lg border-0"
            style={{
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="h3 mb-2 text-primary">
                  <i className="bi bi-shield-lock me-2"></i>
                  {t('title')}
                </h2>
                <p className="text-muted">{t('subtitle')}</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">{t('emailLabel')}</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    disabled={isLoading}
                    className="border-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">{t('passwordLabel')}</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    required
                    disabled={isLoading}
                    className="border-2"
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {t('accessing')}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      {t('access')}
                    </>
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <small className="text-muted">
                  {t('operatorLink')} <Link href="/auth/operator/login" className="text-decoration-none">{t('accessHere')}</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
}

export default function AdminLoginPage() {
  const tCommon = useTranslations('common.actions');
  return (
    <AuthProvider>
      <Suspense fallback={
        <Container fluid className="admin-login">
          <Row className="vh-100 align-items-center justify-content-center">
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{tCommon('loading')}</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      }>
        <AdminLoginContent />
      </Suspense>
    </AuthProvider>
  );
}
