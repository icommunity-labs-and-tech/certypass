'use client';

import { Badge, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
// ObjectViewer removed - not currently used
import { formatValueWithSmartDateDetection } from '@/lib/format';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { retryOrganizationKyc } from '@/actions/organizations/retry-organization-kyc';
import { updateOrgLogo } from '@/actions/organizations/update-org-logo';
import { deleteOrgLogo } from '@/actions/organizations/delete-org-logo';
import { updateOrgBranding } from '@/actions/organizations/update-org-branding';
import LoginPreview from '@/components/auth/LoginPreview';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
// import { updateSigningPreference } from '@/actions/users';

export default function ProfilePageClient({ user }: { user: any }) {
  const t = useTranslations('profile');
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [kycURL, setKycURL] = useState<string | null>(user?.Organization?.kycURL || null);
  const [logoUrl, setLogoUrl] = useState<string | null>(user?.Organization?.logoUrl || null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorPrimary, setColorPrimary] = useState<string>(user?.Organization?.brandColorPrimary || '#0f172a');
  const [colorSecondary, setColorSecondary] = useState<string>(user?.Organization?.brandColorSecondary || '');
  const [colorsSaving, setColorsSaving] = useState(false);
  const [colorsFeedback, setColorsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoFeedback(null);
    const formData = new FormData();
    formData.append('logo', file);
    const result = await updateOrgLogo(formData);
    setLogoUploading(false);
    if (result.error) {
      setLogoFeedback({ type: 'error', message: result.error });
    } else {
      setLogoUrl(result.logoUrl ?? null);
      setLogoFeedback({ type: 'success', message: t('branding.uploadSuccess') });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoDelete = async () => {
    setLogoDeleting(true);
    setLogoFeedback(null);
    const result = await deleteOrgLogo();
    setLogoDeleting(false);
    if (result.error) {
      setLogoFeedback({ type: 'error', message: result.error });
    } else {
      setLogoUrl(null);
      setLogoFeedback({ type: 'success', message: t('branding.deleteSuccess') });
    }
  };

  const handleColorsSave = async () => {
    setColorsSaving(true);
    setColorsFeedback(null);
    const result = await updateOrgBranding({
      brandColorPrimary: colorPrimary || null,
      brandColorSecondary: colorSecondary || null,
    });
    setColorsSaving(false);
    if (result.error) {
      setColorsFeedback({ type: 'error', message: result.error });
    } else {
      setColorsFeedback({ type: 'success', message: t('branding.colorsSuccess') });
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

      {/* Identidad visual — solo para ADMIN */}
      {user.role === 'ADMIN' && user?.Organization && (
        <Box>
          <BoxTitle message={t('branding.title')} />

          <p className="text-muted">{t('branding.description')}</p>

          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title mb-3">{t('branding.currentLogo')}</h6>

              {logoUrl ? (
                <div className="mb-3">
                  <Image
                    src={logoUrl}
                    alt="Logo de la organización"
                    width={180}
                    height={60}
                    style={{ objectFit: 'contain', background: '#f8f9fa', borderRadius: 8, padding: 8 }}
                    unoptimized
                  />
                </div>
              ) : (
                <p className="text-muted small mb-3">
                  <i className="bi bi-image me-1" />
                  {t('branding.noLogo')}
                </p>
              )}

              <p className="text-muted small mb-3">
                <i className="bi bi-info-circle me-1" />
                {t('branding.formatHint')}
              </p>

              <div className="d-flex gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading || logoDeleting}
                >
                  {logoUploading ? (
                    <><Spinner size="sm" className="me-1" />{t('branding.uploading')}</>
                  ) : (
                    <><i className="bi bi-upload me-1" />{t('branding.uploadLogo')}</>
                  )}
                </Button>

                {logoUrl && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleLogoDelete}
                    disabled={logoUploading || logoDeleting}
                  >
                    {logoDeleting ? (
                      <><Spinner size="sm" className="me-1" />{t('branding.deleting')}</>
                    ) : (
                      <><i className="bi bi-trash me-1" />{t('branding.deleteLogo')}</>
                    )}
                  </Button>
                )}
              </div>

              {logoFeedback && (
                <Alert variant={logoFeedback.type === 'success' ? 'success' : 'danger'} className="mt-3 mb-0 py-2 small">
                  <i className={`bi bi-${logoFeedback.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`} />
                  {logoFeedback.message}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Colors + preview — side by side */}
          <Card className="mb-3">
            <Card.Body>
              <h6 className="card-title mb-3">{t('branding.colors')}</h6>

              <Row className="g-4">
                {/* Left: pickers + logo preview + save */}
                <Col md={6}>
                  {/* Logo preview */}
                  {logoUrl && (
                    <div className="mb-3 p-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
                      <Image src={logoUrl} alt="Logo" width={120} height={40} style={{ objectFit: 'contain', maxWidth: '100%' }} unoptimized />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      {t('branding.colorPrimary')}
                      <span className="text-muted fw-normal ms-1 d-block" style={{ fontSize: '0.75rem' }}>{t('branding.colorPrimaryHint')}</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        value={colorPrimary}
                        onChange={e => setColorPrimary(e.target.value)}
                        style={{ width: 40, height: 36, border: '1.5px solid #dee2e6', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                      />
                      <input
                        type="text"
                        value={colorPrimary}
                        onChange={e => setColorPrimary(e.target.value)}
                        maxLength={7}
                        style={{ width: 100, fontSize: '0.85rem', fontFamily: 'monospace' }}
                        className="form-control form-control-sm"
                      />
                      <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setColorPrimary('#0f172a')} title={t('branding.colorsReset')}>
                        <i className="bi bi-arrow-counterclockwise" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      {t('branding.colorSecondary')}
                      <span className="text-muted fw-normal ms-1 d-block" style={{ fontSize: '0.75rem' }}>{t('branding.colorSecondaryHint')}</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        value={colorSecondary || colorPrimary}
                        onChange={e => setColorSecondary(e.target.value)}
                        style={{ width: 40, height: 36, border: '1.5px solid #dee2e6', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                      />
                      <input
                        type="text"
                        value={colorSecondary}
                        onChange={e => setColorSecondary(e.target.value)}
                        maxLength={7}
                        placeholder="#opcional"
                        style={{ width: 100, fontSize: '0.85rem', fontFamily: 'monospace' }}
                        className="form-control form-control-sm"
                      />
                      <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setColorSecondary('')} title={t('branding.colorsReset')}>
                        <i className="bi bi-arrow-counterclockwise" />
                      </Button>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleColorsSave}
                      disabled={colorsSaving}
                    >
                      {colorsSaving
                        ? <><Spinner size="sm" className="me-1" />{t('branding.colorsSaving')}</>
                        : <><i className="bi bi-palette me-1" />{t('branding.colorsSave')}</>
                      }
                    </Button>
                    {colorsFeedback && (
                      <Alert variant={colorsFeedback.type === 'success' ? 'success' : 'danger'} className="mb-0 py-1 px-3 small">
                        <i className={`bi bi-${colorsFeedback.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`} />
                        {colorsFeedback.message}
                      </Alert>
                    )}
                  </div>
                </Col>

                {/* Right: login preview */}
                <Col md={6}>
                  <p className="text-muted small mb-2">
                    <i className="bi bi-eye me-1" />Preview
                  </p>
                  <LoginPreview
                    logoUrl={logoUrl}
                    orgName={user.Organization.nombre}
                    colorPrimary={colorPrimary}
                    colorSecondary={colorSecondary}
                  />
                </Col>
              </Row>
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