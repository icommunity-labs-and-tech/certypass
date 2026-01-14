'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import { getStatusType, deleteStatusType } from '@/actions/statusTypes';
import { getStates } from '@/actions/states';
import { Button } from 'react-bootstrap';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import GenericTable from '@/components/GenericTable';

export default function StatusTypeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const statusTypeId = id as string;
  const [statusType, setStatusType] = useState<any>(null);
  const [states, setStates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useDeleteEntity(deleteStatusType, {
    entityName: 'Estado',
    redirectPath: '/dashboard/status-types',
    onSuccess: () => {
      router.push('/dashboard/status-types');
    },
    onError: (error) => {
      alert('Error al eliminar el estado');
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [stType, statesData] = await Promise.all([
          getStatusType(statusTypeId),
          getStates()
        ]);
        setStatusType(stType);
        // Filtrar estados que usan este tipo de estado
        const filteredStates = statesData.filter((s: any) => s.statusTypeId === statusTypeId);
        setStates(filteredStates);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (statusTypeId) load();
  }, [statusTypeId]);

  if (isLoading) return <LoadingOverlay />;

  if (!statusType) {
    return (
      <Box>
        <BoxTitle message="Estado" />
        <p className="text-danger mb-0">No se encontró información del estado.</p>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-collection me-2" />
            <h4 className="mb-0">Estado: {statusType?.name}</h4>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/status-types/${statusTypeId}/edit`)}
            >
              <i className="bi bi-pencil me-1"></i>
              Editar
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => openDeleteModal(statusType)}
            >
              <i className="bi bi-trash me-1"></i>
              Eliminar
            </Button>
          </div>
        </div>
        <Divider />
        <p className="text-muted mb-0">{statusType?.description || 'Sin descripción'}</p>
      </Box>

      {statusType.template && Array.isArray(statusType.template) && statusType.template.length > 0 && (
        <Box>
          <h6 className="mb-2">Template de Campos</h6>
          <Divider />
          <div className="row g-3">
            {statusType.template.map((field: any, idx: number) => (
              <div key={idx} className="col-12 col-md-6">
                <div className="d-flex justify-content-between border rounded p-2">
                  <span className="text-muted">{field.label || field.name || 'Campo'}</span>
                  <span>{field.type || 'text'}</span>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      <Box>
        <GenericTable
          title={`Estados que usan este tipo (${states.length})`}
          icon="bi-list-columns"
          initialData={states}
          customColumns={[
            {
              key: 'title',
              label: 'Título',
              render: (state: any) => (
                <div>
                  <div className="fw-medium text-primary">{state.title}</div>
                  {state.description && (
                    <div className="text-muted small">{state.description}</div>
                  )}
                </div>
              )
            },
            {
              key: 'itemId',
              label: 'Item',
              render: (state: any) => (
                <button
                  className="btn btn-link p-0 text-primary"
                  onClick={() => router.push(`/dashboard/items/${state.itemId}`)}
                >
                  {state.itemId}
                </button>
              )
            },
            {
              key: 'createdAt',
              label: 'Creado',
              render: (state: any) => (
                <span className="text-muted">
                  {new Date(state.createdAt).toLocaleDateString()}
                </span>
              )
            }
          ]}
        />
      </Box>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Estado"
        message={`¿Estás seguro de que quieres eliminar el estado "${entityToDelete?.name}"?`}
        isLoading={isDeleting}
      />
    </>
  );
}

