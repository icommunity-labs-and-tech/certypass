'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Button, Alert, Card, Container, Spinner, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getOnboardingInfo } from '@/actions/organizations/get-onboarding-info';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import KycStep from '@/components/onboarding/KycStep';

type OnboardingStep = 1 | 2 | 3 | 4;

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estados para información de onboarding
  const [onboardingInfo, setOnboardingInfo] = useState<{
    isFirstAdmin: boolean;
    userName: string;
    organizationName: string;
    organizationId: string;
    kycURL: string | null;
    verificationStatus: 'NOT_VERIFIED' | 'WAITING' | 'VERIFIED' | 'REJECTED';
  } | null>(null);

  // Estados del formulario
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Estado del wizard (solo para primer admin)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Función para obtener la clave de localStorage
  const getStorageKey = () => {
    return token ? `onboarding_${token}` : null;
  };

  // Función para guardar el estado del onboarding
  const saveOnboardingState = (step: OnboardingStep, passwordSet: boolean) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        step,
        passwordSet,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('Error saving onboarding state:', err);
    }
  };

  // Función para cargar el estado del onboarding
  const loadOnboardingState = (): { step: OnboardingStep; passwordSet: boolean } | null => {
    const storageKey = getStorageKey();
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que no sea muy antiguo (más de 7 días)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (parsed.timestamp && parsed.timestamp > sevenDaysAgo) {
          return {
            step: parsed.step || 1,
            passwordSet: parsed.passwordSet || false,
          };
        }
      }
    } catch (err) {
      console.error('Error loading onboarding state:', err);
    }
    return null;
  };

  // Función para limpiar el estado guardado
  const clearOnboardingState = () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.error('Error clearing onboarding state:', err);
      }
    }
  };

  // Cargar información de onboarding al montar
  useEffect(() => {
    const loadOnboardingInfo = async () => {
      if (!token) {
        setError('Token de activación no válido');
        setValidating(false);
        return;
      }

      try {
        const result = await getOnboardingInfo(token);
        if (!result.success || !result.info) {
          setError(result.error || 'Error al cargar información de activación');
          setValidating(false);
          return;
        }

        const info = result.info;

        // Verificar token
        if (!info.tokenValid) {
          setError('Token de activación inválido');
          setValidating(false);
          return;
        }

        if (info.tokenExpired) {
          setError('El token de activación ha expirado');
          setValidating(false);
          return;
        }

        if (info.alreadyActivated) {
          // Si ya está activado, limpiar estado guardado y redirigir
          clearOnboardingState();
          router.push('/auth/admin/login?message=account-activated');
          return;
        }

        setTokenValid(true);
        setOnboardingInfo({
          isFirstAdmin: info.isFirstAdmin,
          userName: info.userName,
          organizationName: info.organizationName,
          organizationId: info.organizationId,
          kycURL: info.kycURL,
          verificationStatus: info.verificationStatus,
        });

        // Si es primer admin, restaurar estado guardado
        if (info.isFirstAdmin) {
          const savedState = loadOnboardingState();
          if (savedState) {
            // Determinar el paso correcto basado en el estado guardado y el estado real
            let restoredStep: OnboardingStep = savedState.step;
            
            // Si el KYC ya está verificado, ir al paso 4 (completado)
            if (info.verificationStatus === 'VERIFIED') {
              restoredStep = 4;
              setAccountActivated(true);
            }
            // Si guardó la contraseña pero no completó KYC, ir al paso 3
            else if (savedState.passwordSet && restoredStep < 3) {
              restoredStep = 3;
            }
            // Si estaba en paso 1 pero guardó contraseña, ir al paso 2
            else if (savedState.passwordSet && restoredStep === 1) {
              restoredStep = 2;
            }

            setCurrentStep(restoredStep);
            setPasswordSaved(savedState.passwordSet);
          }
        }
      } catch (err) {
        console.error('Error loading onboarding info:', err);
        setError('Error al cargar información de activación');
      } finally {
        setValidating(false);
      }
    };

    loadOnboardingInfo();
  }, [token, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    // Si es primer admin, guardar la contraseña y avanzar al siguiente paso
    if (onboardingInfo?.isFirstAdmin) {
      setPasswordSaved(true);
      saveOnboardingState(3, true); // Guardar que completó paso 2 y va al paso 3
      setCurrentStep(3); // Ir al paso de KYC
      return;
    }

    // Si no es primer admin, activar cuenta directamente
    await activateAccount();
  };

  const activateAccount = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          skipKycCheck: !onboardingInfo?.isFirstAdmin, // Solo verificar KYC si es primer admin
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Si es primer admin, el flujo continúa en el paso 4 (completado)
        // Si no es primer admin, redirigir al login
        if (!onboardingInfo?.isFirstAdmin) {
          router.push('/auth/admin/login?message=account-activated');
        }
        // Para primer admin, handleKycVerified maneja la activación y avance al paso 4
      } else {
        setError(data.error || 'Error al activar la cuenta');
      }
    } catch {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const [accountActivated, setAccountActivated] = useState(false);

  const handleKycVerified = async () => {
    // Cuando el KYC está verificado, activar la cuenta
    await activateAccountAndComplete();
  };

  const activateAccountAndComplete = async () => {
    setLoading(true);
    setError('');
    
    if (!token) return;

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          skipKycCheck: true, // KYC ya no es obligatorio para activar
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAccountActivated(true);
        // Guardar estado de completado
        saveOnboardingState(4, true);
        // Avanzar al paso final de confirmación
        setCurrentStep(4);
      } else {
        setError(data.error || 'Error al activar la cuenta');
      }
    } catch {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (currentStep < 4) {
      const nextStep = (currentStep + 1) as OnboardingStep;
      setCurrentStep(nextStep);
      // Guardar estado cuando avanza de paso
      if (onboardingInfo?.isFirstAdmin) {
        saveOnboardingState(nextStep, passwordSaved);
      }
    }
  };

  const handleFinish = () => {
    // Limpiar estado guardado antes de redirigir
    clearOnboardingState();
    // Redirigir al dashboard
    router.push('/dashboard');
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 1) {
      const prevStep = (currentStep - 1) as OnboardingStep;
      setCurrentStep(prevStep);
      // Guardar estado cuando retrocede de paso
      if (onboardingInfo?.isFirstAdmin) {
        saveOnboardingState(prevStep, passwordSaved);
      }
    }
  };

  // Pantalla de carga inicial
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

  // Pantalla de error
  if (!tokenValid || !onboardingInfo) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '100%', maxWidth: '400px' }} className="shadow">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
              <h3 className="mt-3">Error</h3>
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

  // Si es primer admin, mostrar wizard multi-paso
  if (onboardingInfo.isFirstAdmin) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
        <Card style={{ width: '100%', maxWidth: '600px' }} className="shadow">
          <Card.Body className="p-4">
            {/* Indicador de progreso */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Paso {currentStep} de 4</span>
                <span className="text-muted small">
                  {currentStep === 1 && 'Bienvenida'}
                  {currentStep === 2 && 'Contraseña'}
                  {currentStep === 3 && 'Verificación'}
                  {currentStep === 4 && 'Completado'}
                </span>
              </div>
              <ProgressBar
                now={(currentStep / 4) * 100}
                variant="primary"
                style={{ height: '8px' }}
              />
            </div>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                {error}
              </Alert>
            )}

            {/* Paso 1: Bienvenida */}
            {currentStep === 1 && (
              <WelcomeStep
                userName={onboardingInfo.userName}
                organizationName={onboardingInfo.organizationName}
                onNext={handleNext}
              />
            )}

            {/* Paso 2: Contraseña */}
            {currentStep === 2 && (
              <div>
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="bi bi-lock-fill text-primary" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h3 className="mb-2">Establecer Contraseña</h3>
                  <p className="text-muted">
                    Crea una contraseña segura para proteger tu cuenta
                  </p>
                  {passwordSaved && (
                    <Alert variant="info" className="mt-3">
                      <small>
                        <i className="bi bi-info-circle me-2"></i>
                        Ya estableciste una contraseña anteriormente. Puedes cambiarla o continuar con la misma.
                      </small>
                    </Alert>
                  )}
                </div>

                <Form onSubmit={handlePasswordSubmit}>
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

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={handlePrevious}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Anterior
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      className="flex-grow-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          Continuar
                          <i className="bi bi-arrow-right ms-2"></i>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            )}

            {/* Paso 3: KYC (Opcional) */}
            {currentStep === 3 && (
              <div>
                <KycStep
                  organizationId={onboardingInfo.organizationId}
                  activationToken={token!}
                  kycURL={onboardingInfo.kycURL}
                  initialStatus={onboardingInfo.verificationStatus}
                  onVerified={handleKycVerified}
                  onGoToLogin={() => {
                    // Limpiar estado guardado y redirigir al login
                    clearOnboardingState();
                    router.push('/auth/admin/login?message=kyc-completed');
                  }}
                />
                {currentStep === 3 && !accountActivated && (
                  <div className="mt-3 d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={handlePrevious}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Anterior
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={async () => {
                        // Permitir saltar el KYC y activar la cuenta directamente
                        await activateAccountAndComplete();
                      }}
                      disabled={loading}
                      className="flex-grow-1"
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Activando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-right me-2"></i>
                          Omitir KYC y Continuar
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {!accountActivated && (
                  <Alert variant="info" className="mt-3">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Nota:</strong> El KYC es opcional. Puedes completarlo más tarde desde tu perfil. 
                      Sin embargo, necesitarás completar el KYC para crear items y estados certificados.
                    </small>
                  </Alert>
                )}
              </div>
            )}

            {/* Paso 4: Completado */}
            {currentStep === 4 && accountActivated && (
              <div className="text-center">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h2 className="mb-3">¡Onboarding Completado!</h2>
                <p className="lead text-muted mb-4">
                  Tu cuenta ha sido activada exitosamente y tu organización está verificada.
                </p>

                <Card className="mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                  <Card.Body className="p-4">
                    <h5 className="mb-3">Resumen</h5>
                    <div className="text-start">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        <span>Contraseña establecida</span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        <span>Cuenta activada</span>
                      </div>
                      <div className="d-flex align-items-center mb-0">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        <span>Verificación de identidad (KYC) completada</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Alert variant="success" className="mb-4">
                  <Alert.Heading>
                    <i className="bi bi-info-circle me-2"></i>
                    ¡Todo listo!
                  </Alert.Heading>
                  <p className="mb-0">
                    Ya puedes comenzar a usar CertyPass. Serás redirigido al dashboard en unos segundos.
                  </p>
                </Alert>

                <Button
                  variant="success"
                  size="lg"
                  onClick={handleFinish}
                  className="px-5"
                >
                  Ir al Dashboard
                  <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Si no es primer admin, mostrar solo formulario de contraseña (comportamiento original)
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

          <Form onSubmit={handlePasswordSubmit}>
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
