'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Button, Alert, Card, Container, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de activación no válido');
      setValidating(false);
      return;
    }

    // Validar que el token existe (opcional: llamar al backend para validar)
    setTokenValid(true);
    setValidating(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirigir al login con mensaje de éxito
        router.push('/auth/admin/login?message=account-activated');
      } else {
        setError(data.error || 'Error al activar la cuenta');
      }
    } catch {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Validando token...</p>
        </div>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '100%', maxWidth: '400px' }} className="shadow">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
              <h3 className="mt-3">Token Inválido</h3>
            </div>
            <Alert variant="danger">
              {error || 'El link de activación no es válido o ha expirado.'}
            </Alert>
            <Button variant="primary" className="w-100" onClick={() => router.push('/auth/admin/login')}>
              Ir al Login
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-person-check-fill text-success" style={{ fontSize: '3rem' }}></i>
            </div>
            <h2 className="mb-2">Activar Cuenta</h2>
            <p className="text-muted">Establece tu contraseña para activar tu cuenta</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Alert variant="info" className="mb-4">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              Tu cuenta está pendiente de activación. Establece una contraseña segura para comenzar.
            </small>
          </Alert>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña *</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <Form.Control
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <Form.Text className="text-muted">
                Usa al menos 8 caracteres con letras, números y símbolos
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirmar Contraseña *</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <Form.Control
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
            </Form.Group>

            <Button
              variant="success"
              type="submit"
              className="w-100"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Activando cuenta...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Activar Cuenta
                </>
              )}
            </Button>
          </Form>

          <hr className="my-4" />

          <div className="text-center">
            <small className="text-muted">
              ¿Ya tienes cuenta activa?{' '}
              <a href="/auth/admin/login" className="text-primary">
                Iniciar sesión
              </a>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    }>
      <ActivateAccountForm />
    </Suspense>
  );
}





