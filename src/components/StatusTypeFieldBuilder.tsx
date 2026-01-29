'use client';

import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Form, Card, Row, Col, Badge, Alert } from 'react-bootstrap';

export interface StatusTypeFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'image' | 'geolocation';
  required?: boolean;
  options?: string[]; // Para campos de tipo select
}

interface StatusTypeFieldBuilderProps {
  fields: StatusTypeFieldDefinition[];
  onChange: (fields: StatusTypeFieldDefinition[]) => void;
  className?: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export interface StatusTypeFieldBuilderRef {
  validateAll: () => boolean;
  getErrors: () => string[];
}

// Función helper para crear los tipos de campo con traducciones
const createFieldTypes = (t: (key: string) => string) => [
  { value: 'text', label: t('text') },
  { value: 'number', label: t('number') },
  { value: 'email', label: t('email') },
  { value: 'date', label: t('date') },
  { value: 'select', label: t('select') },
  { value: 'image', label: t('image') },
  { value: 'geolocation', label: t('geolocation') },
] as const;

// Función para generar colores automáticamente para las opciones
const getOptionColor = (index: number): string => {
  const colors = [
    '#5bc0de', // Bootstrap info (azul)
    '#5cb85c', // Bootstrap success (verde)
    '#f0ad4e', // Bootstrap warning (amarillo/naranja)
    '#d9534f', // Bootstrap danger (rojo)
    '#337ab7', // Bootstrap primary (azul oscuro)
    '#6f42c1', // Bootstrap secondary (púrpura)
    '#20c997', // Bootstrap teal (turquesa)
    '#fd7e14', // Bootstrap orange (naranja)
    '#e83e8c', // Bootstrap pink (rosa)
    '#6c757d', // Bootstrap secondary (gris)
  ];
  return colors[index % colors.length];
};

const StatusTypeFieldBuilder = forwardRef<StatusTypeFieldBuilderRef, StatusTypeFieldBuilderProps>(({
  fields,
  onChange,
  className = '',
  onValidationChange
}, ref) => {
  const t = useTranslations('fieldTypes');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const FIELD_TYPES = useMemo(() => createFieldTypes(t), [t]);
  const [localFields, setLocalFields] = useState<StatusTypeFieldDefinition[]>(fields);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Rastrear qué campos han sido interactuados por el usuario
  const [touchedFields, setTouchedFields] = useState<Set<number>>(new Set());
  // Flag para indicar si se debe validar todo (al intentar enviar)
  const [validateAll, setValidateAll] = useState(false);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  // Exponer métodos al componente padre mediante ref
  useImperativeHandle(ref, () => ({
    validateAll: () => {
      // Marcar todos los campos como touched y validar
      const allTouched = new Set(localFields.map((_, index) => index));
      setTouchedFields(allTouched);
      setValidateAll(true);
      const errors = validateFields(localFields, allTouched, true);
      setValidationErrors(errors);
      if (onValidationChange) {
        onValidationChange(errors.length === 0, errors);
      }
      return errors.length === 0;
    },
    getErrors: () => {
      return validateFields(localFields, touchedFields, validateAll);
    }
  }));

  // Notificar al padre sobre cambios en la validación
  useEffect(() => {
    if (onValidationChange) {
      const errors = validateFields(localFields, touchedFields, validateAll);
      onValidationChange(errors.length === 0, errors);
    }
  }, [localFields, touchedFields, validateAll, onValidationChange]);

  // Función para validar los campos
  const validateFields = (
    fieldsToValidate: StatusTypeFieldDefinition[], 
    touchedSet: Set<number> = new Set(),
    validateAllFields: boolean = false
  ): string[] => {
    const errors: string[] = [];
    
    fieldsToValidate.forEach((field, index) => {
      // Solo validar si el campo ha sido touched o si se debe validar todo
      const shouldValidate = validateAllFields || touchedSet.has(index);
      
      if (shouldValidate) {
        if (!field.name || field.name.trim() === '') {
          errors.push(tForms('fieldMustHaveNameWithNumber', { number: index + 1 }));
        }
        
        if (field.type === 'select' && (!field.options || field.options.length === 0)) {
          const fieldName = field.name || tCommon('fieldName') + ` ${index + 1}`;
          errors.push(tForms('selectMustHaveOptions', { name: fieldName }));
        }
      }
    });
    
    return errors;
  };

  const updateFieldsWithValidation = (newFields: StatusTypeFieldDefinition[], markTouched?: number) => {
    setLocalFields(newFields);
    
    // Actualizar touchedFields si se especifica un índice
    let updatedTouched = touchedFields;
    if (markTouched !== undefined) {
      updatedTouched = new Set(touchedFields);
      updatedTouched.add(markTouched);
      setTouchedFields(updatedTouched);
    }
    
    // Validar solo campos touched o todos si validateAll está activo
    const errors = validateFields(newFields, updatedTouched, validateAll);
    setValidationErrors(errors);
    
    // Siempre llamar onChange para permitir la edición continua
    onChange(newFields);
  };

  const addField = () => {
    const newField: StatusTypeFieldDefinition = {
      name: '',
      type: 'text',
      required: false,
    };
    
    const updatedFields = [...localFields, newField];
    // No marcar como touched al añadir, solo actualizar campos
    setLocalFields(updatedFields);
    onChange(updatedFields);
    // Limpiar errores al añadir un nuevo campo
    setValidationErrors([]);
  };

  const removeField = (index: number) => {
    const updatedFields = localFields.filter((_, i) => i !== index);
    updateFieldsWithValidation(updatedFields);
  };

  const updateField = (index: number, field: Partial<StatusTypeFieldDefinition>) => {
    const updatedFields = localFields.map((f, i) => 
      i === index ? { ...f, ...field } : f
    );
    // Marcar como touched cuando el usuario modifica el campo
    updateFieldsWithValidation(updatedFields, index);
  };

  // Marcar campo como touched cuando pierde el foco
  const handleFieldBlur = (index: number) => {
    if (!touchedFields.has(index)) {
      const updatedTouched = new Set(touchedFields);
      updatedTouched.add(index);
      setTouchedFields(updatedTouched);
      // Validar después de marcar como touched
      const errors = validateFields(localFields, updatedTouched, validateAll);
      setValidationErrors(errors);
    }
  };

  const addOption = (fieldIndex: number, value?: string) => {
    const field = localFields[fieldIndex];
    if (field.type === 'select') {
      const newOptions = [...(field.options || []), value || 'Nueva opción'];
      updateField(fieldIndex, { options: newOptions });
    }
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = localFields[fieldIndex];
    if (field.type === 'select' && field.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldIndex, { options: newOptions });
    }
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = localFields[fieldIndex];
    if (field.type === 'select' && field.options) {
      const newOptions = field.options.filter((_, i) => i !== optionIndex);
      updateField(fieldIndex, { options: newOptions });
    }
  };

  return (
    <div className={`status-type-field-builder ${className}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Campos específicos del tipo de estado</h6>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={addField}
          className="d-flex align-items-center gap-1"
        >
          <i className="bi bi-plus-lg"></i>
          Agregar campo
        </Button>
      </div>

      {/* Mostrar errores de validación */}
      {validationErrors.length > 0 && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading className="h6">Errores de validación:</Alert.Heading>
          <ul className="mb-0">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {localFields.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <p className="mb-0">No hay campos específicos definidos</p>
          <small>Haz clic en &quot;Agregar campo&quot; para comenzar</small>
        </div>
      ) : (
        <div className="fields-list">
          {localFields.map((field, index) => (
            <Card key={index} className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="primary">{tCommon('fieldName')} {index + 1}</Badge>
                  {field.required && (
                    <Badge bg="danger" className="small">{tCommon('required')}</Badge>
                  )}
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="d-flex align-items-center gap-1"
                >
                  <i className="bi bi-x-lg"></i>
                </Button>
              </Card.Header>
              <Card.Body className="py-3">
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>{tCommon('fieldName')}</Form.Label>
                      <Form.Control
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        onBlur={() => handleFieldBlur(index)}
                        placeholder={tCommon('fieldNamePlaceholder')}
                        size="sm"
                      />
                      <Form.Text className="text-muted">
                        {tCommon('fieldNameHelp')}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de campo</Form.Label>
                      <Form.Select
                        value={field.type}
                        onChange={(e) => updateField(index, { 
                          type: e.target.value as StatusTypeFieldDefinition['type'],
                          options: e.target.value === 'select' ? ['Opción 1'] : undefined
                        })}
                        size="sm"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>{tCommon('fieldRequired')}</Form.Label>
                      <div className="d-flex align-items-center h-100">
                        <Form.Check
                          type="checkbox"
                          label={tCommon('required')}
                          checked={field.required || false}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {field.type === 'select' && (
                  <Row>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label className="mb-2">Opciones</Form.Label>
                        
                        {/* Bootstrap Tags Input style */}
                        <div className="bootstrap-tagsinput" style={{
                          border: '1px solid #ced4da',
                          borderRadius: '0.375rem',
                          padding: '2px 6px',
                          minHeight: '38px',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          {/* Tags display */}
                          {field.options?.map((option, optionIndex) => (
                            <span key={optionIndex} className="tag label label-info" style={{
                              backgroundColor: getOptionColor(optionIndex),
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '12px',
                              display: 'inline-block',
                              margin: '1px'
                            }}>
                              {option}
                              <span 
                                style={{ 
                                  marginLeft: '5px', 
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                                onClick={() => removeOption(index, optionIndex)}
                              >
                                ×
                              </span>
                            </span>
                          ))}
                          
                          {/* Input for new tags */}
                          <input
                            type="text"
                            placeholder="Escribe una opción y presiona Enter"
                            style={{
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              padding: '4px',
                              fontSize: '14px',
                              minWidth: '120px',
                              flex: '1'
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value && !field.options?.includes(value)) {
                                  addOption(index, value);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          
                          {(!field.options || field.options.length === 0) && (
                            <span style={{ 
                              color: '#6c757d', 
                              fontSize: '14px',
                              fontStyle: 'italic'
                            }}>
                              No hay opciones definidas
                            </span>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

StatusTypeFieldBuilder.displayName = 'StatusTypeFieldBuilder';

export default StatusTypeFieldBuilder;

