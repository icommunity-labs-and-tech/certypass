'use client';

import { Badge, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
// ObjectViewer removed - not currently used
import { formatValueWithSmartDateDetection } from '@/lib/format';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { retryOrganizationKyc } from '@/actions/organizations/retry-organization-kyc';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
// import { updateSigningPreference } from '@/actions/users';

export default function ProfilePageClient({ user }: { user: any }) {
  const t = useTranslations('profile');
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [kycURL, setKycURL] = useState<string | null>(user?.Organization?.kycURL || null);

  const handleRetryKyc = async () => {
    setRetrying(true);
    setRetryError(null);
    
    try {
      const result = await retryOrganizationKyc();
      if (result.success) {
        if (result.kycURL) {
          setKycURL(result.kycURL);
          // Si estaba rechazado, actualizar el estado local a WAITING
          if (user?.Organization?.verificationStatus === 'REJECTED') {
            user.Organization.verificationStatus = 'WAITING';
            user.Organization.kycURL = result.kycURL;
          }
          window.open(result.kycURL, '_blank', 'noopener,noreferrer');
          // Recargar la página después de un breve delay para reflejar los cambios
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setRetryError(t('kyc.noUrlError'));
        }
      } else {
        setRetryError(result.error || t('kyc.retry'));
      }
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : t('kyc.noUrlError'));
    } finally {
      setRetrying(false);
    }
  };


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'primary';
      case 'USER': return 'info';
      default: return 'secondary';
    }
  };

  // getVerificationBadgeVariant removed - not currently used
  // const getVerificationBadgeVariant = (status: string) => {
  //   switch (status) {
  //     case 'VERIFIED': return 'success';
  //     case 'WAITING': return 'warning';
  //     case 'REJECTED': return 'danger';
  //     case 'NOT_VERIFIED': return 'secondary';
  //     default: return 'secondary';
  //   }
  // };

  // getVerificationStatusText removed - not currently used
  // const getVerificationStatusText = (status: string) => {
  //   switch (status) {
  //     case 'VERIFIED': return 'Verificado';
  //     case 'WAITING': return 'En espera';
  //     case 'REJECTED': return 'Rechazado';
  //     case 'NOT_VERIFIED': return 'No verificado';
  //     default: return status;
  //   }
  // };

  return (
    <>
      {/* Información Personal */}
      <Box>
        <BoxTitle message={t('personalInfo')}/>

        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Body>
                <h6 className="card-title">{t('basicData')}</h6>
                <div className="mb-2">
                  <strong>{t('name')}</strong> {user.name || t('notSpecified')}
                </div>
                <div className="mb-2">
                  <strong>{t('email')}</strong> {user.email}
                </div>
                <div className="mb-2">
                  <strong>{t('phone')}</strong> {user.phone || t('notSpecified')}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3">
              <Card.Body>
                <h6 className="card-title">{t('accountStatus')}</h6>
                <div className="mb-2">
                  <strong>{t('role')}</strong> {' '}
                  <Badge bg={getRoleBadgeVariant(user.role)}>
                    {user.role === 'ADMIN' ? t('roleAdmin') : t('roleUser')}
                  </Badge>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>

        {user.notes && (
          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title">{t('notes')}</h6>
              <p className="card-text">{user.notes}</p>
            </Card.Body>
          </Card>
        )}

        <Card className="mb-3">
          <Card.Body>
            <h6 className="card-title">{t('accountInfo')}</h6>
            <div className="mb-2">
              <strong>{t('created')}</strong> {formatValueWithSmartDateDetection(user.createdAt, 'createdAt')}
            </div>
            <div className="mb-2">
              <strong>{t('lastUpdated')}</strong> {formatValueWithSmartDateDetection(user.updatedAt, 'updatedAt')}
            </div>
          </Card.Body>
        </Card>
      </Box>


      {/* Verificación de Identidad (KYC) */}
      {user?.Organization && (
        <Box>
          <BoxTitle message={t('kyc.title')}/>

          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title">{t('kyc.orgVerificationStatus')}</h6>
              <div className="mb-3">
                <strong>{t('kyc.organization')}</strong> {user.Organization.nombre}
              </div>
              <div className="mb-3">
                <strong>{t('kyc.status')}</strong>{' '}
                <Badge
                  bg={
                    user.Organization.verificationStatus === 'VERIFIED' ? 'success' :
                    user.Organization.verificationStatus === 'WAITING' ? 'warning' :
                    user.Organization.verificationStatus === 'REJECTED' ? 'danger' :
                    'secondary'
                  }
                >
                  {user.Organization.verificationStatus === 'VERIFIED' ? t('kyc.verified') :
                   user.Organization.verificationStatus === 'WAITING' ? t('kyc.waiting') :
                   user.Organization.verificationStatus === 'REJECTED' ? t('kyc.rejected') :
                   t('kyc.notVerified')}
                </Badge>
              </div>

              {user.Organization.verificationStatus !== 'VERIFIED' && (
                <>
                  <Alert variant={user.Organization.verificationStatus === 'REJECTED' ? 'danger' : 'warning'} className="mb-3">
                    <Alert.Heading>
                      <i className={`bi bi-${user.Organization.verificationStatus === 'REJECTED' ? 'x-circle' : 'clock'}-fill me-2`}></i>
                      {user.Organization.verificationStatus === 'REJECTED'
                        ? t('kyc.rejectedTitle')
                        : t('kyc.pendingTitle')}
                    </Alert.Heading>
                    <p className="mb-0">
                      {user.Organization.verificationStatus === 'REJECTED'
                        ? t('kyc.rejectedDescription')
                        : t('kyc.pendingDescription')}
                    </p>
                    {user.Organization.verificationStatus === 'WAITING' && (
                      <p className="mb-0 mt-2 small">
                        <i className="bi bi-info-circle me-1"></i>
                        {t('kyc.waitingNote')}
                      </p>
                    )}
                  </Alert>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant={user.Organization.verificationStatus === 'REJECTED' ? 'danger' : 'outline-primary'}
                      onClick={handleRetryKyc}
                      disabled={retrying}
                    >
                      {retrying ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          {t('kyc.retrying')}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          {t('kyc.retry')}
                        </>
                      )}
                    </Button>
                  </div>

                  {retryError && (
                    <Alert variant="danger" className="mt-3">
                      {retryError}
                    </Alert>
                  )}

                  <p className="text-muted small mt-3 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    {t('kyc.needKycNote')}
                  </p>
                </>
              )}

              {user.Organization.verificationStatus === 'VERIFIED' && (
                <Alert variant="success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {t('kyc.verifiedMessage')}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Box>
      )}

      {/* Cambio de Contraseña */}
      <Box>
        <BoxTitle message={t('changePassword')}/>

        <p>{t('changePasswordDescription')}</p>

        <ChangePasswordForm />
      </Box>

    </>
  );
}