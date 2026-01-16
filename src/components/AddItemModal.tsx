'use client';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import { useEffect, useState } from 'react';
import type { FormTemplate } from './GenericTable';
import ImageConfigSection from './ImageConfigSection';
import DynamicImageField from './DynamicImageField';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import ItemCreationWizard from './ItemCreationWizard';
import { checkEmailExists } from '@/actions/users';

type AddItemModalProps = {
  show: boolean;
  onHide: () => void;
  formTemplate: FormTemplate;
  formState: Record<string, any>;
  setFormState: (data: Record<string, any>) => void;
  onSubmit: (combinedData: Record<string, any>, templateFields?: FormTemplate) => void;
  allowTemplateEditing?: boolean;
  attachmentId?: string;
  customFormContent?: React.ReactNode;
  isIssueTemplate?: boolean;
  uploadType?: 'product' | 'item' | 'issue';
  onCategoryChange?: (categoryId: string | null) => void;
  useWizard?: boolean; // Nueva prop para activar el wizard
};

export default function AddItemModal({
  show,
  onHide,
  formTemplate,
  formState,
  setFormState,
  onSubmit,
  allowTemplateEditing = true,
  attachmentId,
  customFormContent,
  isIssueTemplate = false,
  uploadType = 'product',
  onCategoryChange,
  useWizard = false
}: AddItemModalProps) {
  const [imageConfig, setImageConfig] = useState({
    allowMultipleImages: false,
    maxImages: 1,
  });
  const [preflight, setPreflight] = useState<{ overLimit: boolean; totalBytes: number; limitBytes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingCategoryItems, setIsLoadingCategoryItems] = useState(false);
  const [selectedCopyItemId, setSelectedCopyItemId] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    // Only for issue creation, estimate payload size and warn
    if (!isIssueTemplate) return;
    const imageUrls: string[] = formState?.imageUrls || [];
    const description = String(formState?.description || '');
    // quick debounce-like
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/issues/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls, description }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreflight({ overLimit: data.overLimit, totalBytes: data.totalBytes, limitBytes: data.limitBytes });
        } else setPreflight(null);
      } catch {
        setPreflight(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isIssueTemplate, formState?.imageUrls, formState?.description]);

  // Validación en tiempo real del email para formularios de usuario
  useEffect(() => {
    const isUserForm = formTemplate.some(field => 
      field.name === 'email' || field.name === 'role'
    );
    
    if (!isUserForm || !formState?.email) {
      setEmailError(null);
      return;
    }

    const email = formState.email.trim();
    
    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('El formato del email no es válido');
      return;
    }

    // Debounce para evitar muchas llamadas al servidor
    const timer = setTimeout(async () => {
      if (email && emailRegex.test(email)) {
        setIsCheckingEmail(true);
        setEmailError(null);
        
        try {
          const result = await checkEmailExists(email);
          if (result.exists) {
            setEmailError('Ya existe un usuario con este email');
          } else if (result.error) {
            setEmailError(result.error);
          } else {
            setEmailError(null);
          }
        } catch (error) {
          console.error('Error checking email:', error);
          setEmailError('Error al verificar el email');
        } finally {
          setIsCheckingEmail(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formState?.email, formTemplate]);


  // Función para validar campos requeridos
  const validateRequiredFields = (): string[] => {
    const errors: string[] = [];
    
    formTemplate.forEach((field) => {
      if (field.required) {
        const value = formState?.[field.name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`El campo "${field.label}" es obligatorio`);
        }
      }
    });
    
    return errors;
  };

  // Función para generar el título del modal basado en el contexto
  const getModalTitle = () => {
    if (isIssueTemplate) {
      return 'Nuevo Estado';
    }
    
    // Detectar si es un formulario de usuario por los campos específicos
    const isUserForm = formTemplate.some(field => 
      field.name === 'email' || field.name === 'role'
    );
    
    if (isUserForm) {
      return 'Añadir Usuario';
    }
    
    switch (uploadType) {
      case 'item':
        return 'Añadir Producto';
      case 'product':
        return 'Añadir Categoría';
      case 'issue':
        return 'Nuevo Estado';
      default:
        return 'Añadir Elemento';
    }
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Prevenir envío si hay error de email
    if (emailError) {
      setError(emailError);
      return;
    }
    
    // Validar campos requeridos
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    try {
      const finalData = {
        ...(formState || {}),
        ...(attachmentId ? { attachmentId: attachmentId } : {}),
        ...(isIssueTemplate ? {
          allowMultipleImages: imageConfig.allowMultipleImages,
          maxImages: imageConfig.maxImages,
        } : {}),
      };
      await onSubmit(finalData);
    } catch (err: any) {
      setError(err.message || 'Error al crear el elemento');
    }
  };

  // Cargar items de la categoría seleccionada para el desplegable de copia
  useEffect(() => {
    const categoryId = formState?.categoryId;
    if (!categoryId) {
      setCategoryItems([]);
      setSelectedCopyItemId('');
      return;
    }
    const load = async () => {
      try {
        setIsLoadingCategoryItems(true);
        const res = await fetch(`/api/items/by-category?categoryId=${encodeURIComponent(categoryId)}`);
        if (!res.ok) throw new Error('Error cargando productos de la categoría');
        const data = await res.json();
        setCategoryItems((data || []).map((i: any) => ({ id: i.id, name: i.name })));
        // Resetear selección al cambiar de categoría
        setSelectedCopyItemId('');
      } catch (e) {
        setCategoryItems([]);
      } finally {
        setIsLoadingCategoryItems(false);
      }
    };
    load();
  }, [formState?.categoryId]);

  const handleCopyFromItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`);
      if (!res.ok) throw new Error('No se pudo cargar el producto seleccionado');
      const item = await res.json();

      // Preservar el customId que el usuario haya escrito
      const preservedCustomId = formState?.customId || '';

      // Construir nuevo estado combinando datos del item
      const merged: Record<string, any> = {
        ...(formState || {}),
        name: item.name || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        categoryId: item.categoryId || '',
        ...(item.templateFields || {}),
      };

      // Restaurar customId
      merged.customId = preservedCustomId;

      setFormState(merged);

      // Si cambia la categoría, disparar onCategoryChange
      if (onCategoryChange && item.categoryId && item.categoryId !== formState?.categoryId) {
        onCategoryChange(item.categoryId);
      }
    } catch (e: any) {
      setError(e?.message || 'Error copiando datos del producto');
    }
  };

  const renderField = (field: any) => {
    // Validar que field existe y tiene las propiedades necesarias
    if (!field || !field.name) {
      console.warn('Invalid field in formTemplate:', field);
      return null;
    }

    if (field.type === 'image') {
      return (
        <DynamicImageField
          key={field.name}
          name={field.name}
          label={field.label}
          value={formState?.[field.name]}
          onChange={(value) => setFormState({ ...(formState || {}), [field.name]: value })}
          uploadType={uploadType}
          required={field.required}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Form.Group className="mb-3" controlId={field.name} key={field.name}>
          <Form.Label>
            {field.label}
            {field.required && <span className="text-danger ms-1">*</span>}
          </Form.Label>
          <Form.Select
            name={field.name}
            value={formState?.[field.name] || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormState({ ...(formState || {}), [field.name]: value });
              
              // Si es el campo categoryId, llamar a onCategoryChange
              if (field.name === 'categoryId' && onCategoryChange) {
                onCategoryChange(value || null);
              }
            }}
            required={field.required}
          >
            <option value="">{field.placeholder || 'Seleccionar...'}</option>
            {field.options?.map((option: any, index: number) => (
              <option key={`${field.name}-option-${option.value || index}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          {field.name === 'categoryId' && formState?.categoryId && (
            <div className="mt-2">
              <Form.Label className="mb-1">Copiar campos de</Form.Label>
              <Form.Select
                value={selectedCopyItemId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSelectedCopyItemId(selectedId);
                  if (!selectedId) {
                    // Limpiar todo menos categoryId/customId para evitar residuos (incluye arrays como imageUrls)
                    setFormState({
                      categoryId: formState?.categoryId || '',
                      customId: formState?.customId || ''
                    });
                    return;
                  }
                  handleCopyFromItem(selectedId);
                }}
                disabled={isLoadingCategoryItems}
              >
                <option value="">{isLoadingCategoryItems ? 'Cargando productos…' : 'No copiar'}</option>
                {categoryItems.map((it) => (
                  <option key={it.id} value={it.id}>{it.name || it.id}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Se copiarán nombre, descripción, imagen y campos de template. Tu ID se mantiene.</Form.Text>
            </div>
          )}
        </Form.Group>
      );
    }

    // Campo especial para ID personalizado
    if (field.name === 'customId') {
      return (
        <Form.Group className="mb-3" controlId={field.name} key={field.name}>
          <Form.Label>{field.label}</Form.Label>
          <Form.Control
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            required
            value={formState?.[field.name] || ''}
            onChange={(e) =>
              setFormState({ ...(formState || {}), [field.name]: e.target.value })
            }
          />
          <Form.Text className="text-muted">
            El ID es obligatorio, debe ser único y se usará para generar el código QR.
          </Form.Text>
        </Form.Group>
      );
    }

    // Campo textarea para texto largo
    if (field.type === 'textarea') {
      return (
        <Form.Group className="mb-3" controlId={field.name} key={field.name}>
          <Form.Label>
            {field.label}
            {field.required && <span className="text-danger ms-1">*</span>}
          </Form.Label>
          <Form.Control
            name={field.name}
            as="textarea"
            rows={4}
            placeholder={field.placeholder}
            value={formState?.[field.name] || ''}
            onChange={(e) =>
              setFormState({ ...(formState || {}), [field.name]: e.target.value })
            }
            required={field.required}
          />
        </Form.Group>
      );
    }

    // Validación especial para campo email en formularios de usuario
    const isUserForm = formTemplate.some(f => f.name === 'email' || f.name === 'role');
    const isEmailField = field.name === 'email' && isUserForm;

    return (
      <Form.Group className="mb-3" controlId={field.name} key={field.name}>
        <Form.Label>
          {field.label}
          {field.required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
        <div className="position-relative">
          <Form.Control
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={formState?.[field.name] || ''}
            onChange={(e) =>
              setFormState({ ...(formState || {}), [field.name]: e.target.value })
            }
            required={field.required}
            isInvalid={isEmailField && !!emailError}
            isValid={isEmailField && formState?.[field.name] && !emailError && !isCheckingEmail}
          />
          {isEmailField && isCheckingEmail && (
            <div className="position-absolute top-50 end-0 translate-middle-y me-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Verificando...</span>
              </div>
            </div>
          )}
          {isEmailField && emailError && (
            <Form.Control.Feedback type="invalid">
              {emailError}
            </Form.Control.Feedback>
          )}
          {isEmailField && formState?.[field.name] && !emailError && !isCheckingEmail && (
            <Form.Control.Feedback type="valid">
              Email disponible
            </Form.Control.Feedback>
          )}
        </div>
      </Form.Group>
    );
  };

  // Si useWizard es true, renderizar el wizard en lugar del modal tradicional
  if (useWizard) {
    return (
      <ItemCreationWizard
        show={show}
        onHide={onHide}
        formTemplate={formTemplate}
        formState={formState}
        setFormState={setFormState}
        onSubmit={onSubmit}
        allowTemplateEditing={allowTemplateEditing}
        attachmentId={attachmentId}
        customFormContent={customFormContent}
        isIssueTemplate={isIssueTemplate}
        uploadType={uploadType}
        onCategoryChange={onCategoryChange}
      />
    );
  }

  // Modal tradicional (comportamiento por defecto)
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{getModalTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {preflight?.overLimit && (
            <Alert variant="warning">
              <div className="mb-2">
                El tamaño estimado de la evidencia supera el máximo de
                {' '}
                <strong>{(preflight.limitBytes / (1024 * 1024)).toFixed(0)} MB</strong>.
              </div>
              <div className="mb-2">
                Total estimado: <strong>{(preflight.totalBytes / (1024 * 1024)).toFixed(2)} MB</strong>
                {' '}(
                +{((preflight.totalBytes - preflight.limitBytes) / (1024 * 1024)).toFixed(2)} MB por encima)
              </div>
              {Array.isArray(formState?.imageUrls) && formState?.imageUrls.length > 0 && (
                <>
                  <div className="mb-1">Detalle de imágenes:</div>
                  <ListGroup className="mb-2">
                    {formState?.imageUrls?.map((u: string, idx: number) => {
                      const bytes = (preflight as any)?.items?.find((it: any) => it.url === u)?.bytes ?? 0;
                      const sizeMB = (bytes / (1024 * 1024)).toFixed(2);
                      return (
                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                          <span className="text-truncate" style={{ maxWidth: 360 }} title={u}>{u}</span>
                          <span className="ms-2">{sizeMB} MB</span>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </>
              )}
              <div className="mb-0">
                Sugerencia: reduce la calidad o resolución de las fotos antes de adjuntarlas
                para cumplir el límite. El número de fotos lo define el template del issue.
              </div>
            </Alert>
          )}
          
          {formTemplate.filter(field => field && field.name).map((field) => renderField(field))}
          
          {customFormContent && (
            <>
              <hr className="my-3" />
              {customFormContent}
            </>
          )}

          {isIssueTemplate && (
            <>
              <hr className="my-3" />
              <ImageConfigSection
                allowMultipleImages={imageConfig.allowMultipleImages}
                maxImages={imageConfig.maxImages}
                onConfigChange={setImageConfig}
              />
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isCheckingEmail || !!emailError}
        >
          {isCheckingEmail ? 'Verificando email...' : 
           emailError ? 'Corrija los errores' : 
           'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
