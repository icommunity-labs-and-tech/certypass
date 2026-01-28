'use client';

import { useState, useEffect, Suspense } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthSeparated, AuthProvider } from '@/hooks/useAuthSeparated';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function OperatorLoginContent() {
  const t = useTranslations('auth.login.operator');
  const tCommon = useTranslations('common.actions');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuthSeparated();

  // Redirigir si ya está autenticado como operador
  useEffect(() => {
    if (user && !loading && user.role === 'USER') {
      router.push('/operator');
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
      const result = await login(email, password, 'operator');

      if (result.success) {
        setError(null);
        router.push('/operator');
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
      <Container fluid className="operator-login">
        <Row className="vh-100 align-items-center justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={4}>
            <div className="text-center">
              <div className="spinner-border text-success" role="status">
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
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `
          repeating-radial-gradient(circle at 30% 30%, transparent 0px, transparent 40px, rgba(16, 185, 129, 0.15) 41px, rgba(16, 185, 129, 0.15) 42px, transparent 43px, transparent 80px),
          repeating-radial-gradient(circle at 70% 60%, transparent 0px, transparent 35px, rgba(16, 185, 129, 0.12) 36px, rgba(16, 185, 129, 0.12) 37px, transparent 38px, transparent 70px),
          repeating-radial-gradient(circle at 20% 80%, transparent 0px, transparent 45px, rgba(16, 185, 129, 0.14) 46px, rgba(16, 185, 129, 0.14) 47px, transparent 48px, transparent 90px),
          radial-gradient(circle at 40% 20%, rgba(52, 211, 153, 0.5) 4px, transparent 4px),
          radial-gradient(circle at 75% 35%, rgba(52, 211, 153, 0.5) 4px, transparent 4px),
          radial-gradient(circle at 60% 75%, rgba(52, 211, 153, 0.5) 4px, transparent 4px),
          radial-gradient(circle at 15% 65%, rgba(52, 211, 153, 0.5) 4px, transparent 4px),
          radial-gradient(circle at 85% 80%, rgba(52, 211, 153, 0.5) 4px, transparent 4px),
          linear-gradient(120deg, transparent 45%, rgba(52, 211, 153, 0.08) 48%, rgba(52, 211, 153, 0.08) 52%, transparent 55%),
          linear-gradient(-60deg, transparent 45%, rgba(52, 211, 153, 0.08) 48%, rgba(52, 211, 153, 0.08) 52%, transparent 55%),
          linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 150px 150px, 150px 150px, 100% 100%'
      }}
    >
      <Row className="vh-100 align-items-center justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card 
            className="shadow-lg border-0"
            style={{
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-phone display-4 text-success"></i>
                </div>
                <h2 className="h4 mb-2 text-success fw-bold">
                  {t('title')}
                </h2>
                <p className="text-muted mb-0">{t('subtitle')}</p>
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
                  variant="success"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(45deg, #11998e, #38ef7d)',
                    border: 'none',
                    borderRadius: '12px',
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
                  {t('adminLink')} <Link href="/auth/admin/login" className="text-decoration-none">{t('accessHere')}</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
}

export default function OperatorLoginPage() {
  const tCommon = useTranslations('common.actions');
  return (
    <AuthProvider>
      <Suspense fallback={
        <Container fluid className="operator-login">
          <Row className="vh-100 align-items-center justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6} xl={4}>
              <div className="text-center">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">{tCommon('loading')}</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      }>
        <OperatorLoginContent />
      </Suspense>
    </AuthProvider>
  );
}
