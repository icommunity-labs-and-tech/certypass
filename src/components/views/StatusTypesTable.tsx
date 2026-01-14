"use client";

import Box from '@/components/Box';
import GenericTable, { FormTemplate, TableAction } from '@/components/GenericTable';
import LoadingOverlay from '@/components/Loading';
import { addStatusType, listStatusTypes, updateStatusType, deleteStatusType, getStatusType } from '@/actions/statusTypes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import StatusTypeFieldBuilder, { StatusTypeFieldDefinition } from '@/components/StatusTypeFieldBuilder';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import { Divider } from '@/components/Divider';

const statusTypeFormTemplate: FormTemplate = [
  { name: 'name', label: 'Nombre', type: 'text' as const, placeholder: 'Nombre del tipo de estado', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' as const, placeholder: 'Descripción del tipo de estado', required: false },
];

interface StatusTypesTableProps {
  title?: string;
  showBox?: boolean;
  onStatusTypeSelect?: (statusType: any) => void;
  customActions?: Array<{ label: string; onClick: (row: any) => void }>;
  customColumns?: Array<{ key: string; label: string; render: (statusType: any) => React.ReactNode }>;
}

export default function StatusTypesTable({ 
  title = "Tipos de estado",
  showBox = true,
  onStatusTypeSelect,
  customActions = [],
  customColumns = [],
}: StatusTypesTableProps) {
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [editingStatusType, setEditingStatusType] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', template: [] as StatusTypeFieldDefinition[] });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Usar el hook refactorizado
  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useDeleteEntity(deleteStatusType, {
    entityName: 'Tipo de estado',
    redirectPath: '/dashboard/status-types',
    onSuccess: () => {
      if (entityToDelete) {
        setStatusTypes(prev => prev.filter(st => st.id !== entityToDelete.id));
      }
    },
    onError: (error) => {
      alert('Error al eliminar el tipo de estado');
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listStatusTypes();
        setStatusTypes(data);
      } catch (e) {
        console.error('Error loading status types:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleEditStatusType = async (statusType: any) => {
    try {
      const fullStatusType = await getStatusType(statusType.id);
      setEditingStatusType(fullStatusType);
      setEditFormData({
        name: fullStatusType.name,
        description: fullStatusType.description,
        template: Array.isArray(fullStatusType.template) ? fullStatusType.template : []
      });
      setEditError(null);
    } catch (err) {
      console.error('Error cargando StatusType:', err);
      setEditError('Error al cargar el tipo de estado');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStatusType) return;
    
    setIsSavingEdit(true);
    setEditError(null);
    
    try {
      const updated = await updateStatusType(editingStatusType.id, {
        name: editFormData.name,
        description: editFormData.description,
        template: editFormData.template
      });
      
      setStatusTypes(prev => prev.map(st => st.id === updated.id ? updated : st));
      setEditingStatusType(null);
      setEditFormData({ name: '', description: '', template: [] });
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar el tipo de estado');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const statusTypeActions: TableAction[] = [
    {
      label: 'Editar',
      onClick: handleEditStatusType,
      icon: 'bi-pencil',
      variant: 'outline-secondary'
    },
    {
      label: 'Eliminar',
      onClick: (statusType: any) => openDeleteModal(statusType),
      icon: 'bi-trash',
      variant: 'outline-danger'
    },
    ...customActions
  ];

  if (isLoading) return <LoadingOverlay />;

  const tableContent = (
    <GenericTable
      initialData={statusTypes}
      title={title}
      icon="bi-collection"
      formTemplate={statusTypeFormTemplate}
      onAddSubmit={async (formData: any) => {
        // El template viene del customFormContent a través del formState
        const created = await addStatusType(formData);
        setStatusTypes(prev => [created, ...prev]);
        return created;
      }}
      allowTemplateEditing={false}
      customFormContent={({ formState, setFormState }) => {
        const template = formState.template || [];
        return (
          <StatusTypeFieldBuilder
            fields={template}
            onChange={(fields: StatusTypeFieldDefinition[]) => {
              setFormState({ ...formState, template: fields });
            }}
            className="mt-3"
          />
        );
      }}
      actions={statusTypeActions}
      customColumns={customColumns.length > 0 ? customColumns : [
        {
          key: 'name',
          label: 'Nombre',
          render: (statusType: any) => (
            <div className="fw-medium text-primary">{statusType.name}</div>
          )
        },
        {
          key: 'description',
          label: 'Descripción',
          render: (statusType: any) => (
            <div className="text-muted">{statusType.description || '-'}</div>
          )
        },
        {
          key: 'createdAt',
          label: 'Fecha de Creación',
          render: (statusType: any) => (
            <span className="text-muted">
              {new Date(statusType.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )
        }
      ]}
    />
  );

  return (
    <>
      {showBox && (
        <Box>
          <h6 className="mb-2">¿Qué son los tipos de estado?</h6>
          <Divider />
          <p className="mb-0 text-muted">
            Los tipos de estado definen las plantillas y estructuras de datos para los diferentes estados que pueden tener los items. 
            Cada tipo de estado puede tener campos personalizados que permiten capturar información específica, como inspecciones, reparaciones o verificaciones, 
            y se utilizan para crear estados consistentes y estructurados en el sistema.
          </p>
        </Box>
      )}

      {showBox ? (
        <Box>
          {tableContent}
        </Box>
      ) : (
        tableContent
      )}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Tipo de Estado"
        message={`¿Estás seguro de que quieres eliminar el tipo de estado "${entityToDelete?.name}"?`}
        isLoading={isDeleting}
      />

      {/* Modal para editar StatusType */}
      <Modal show={!!editingStatusType} onHide={() => setEditingStatusType(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Tipo de Estado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && (
            <Alert variant="danger" className="mb-3">
              {editError}
            </Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </Form.Group>
            <StatusTypeFieldBuilder
              fields={editFormData.template}
              onChange={(fields: StatusTypeFieldDefinition[]) => {
                setEditFormData({ ...editFormData, template: fields });
              }}
              className="mt-3"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingStatusType(null)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
            {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

