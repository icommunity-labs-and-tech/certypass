'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@/components/Box';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Button } from 'react-bootstrap';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import { deleteUser, getUserById } from '@/actions/users';

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = id as string;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wrapper para deleteUser que cumple con la interfaz esperada
  const deleteUserWrapper = async (id: string) => {
    const result = await deleteUser(id);
    return {
      success: result.success,
      message: result.success ? (result.message || 'Usuario eliminado correctamente') : (result.error || 'Error al eliminar usuario')
    };
  };

  // Usar el hook refactorizado
  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useDeleteEntity(deleteUserWrapper, {
    entityName: 'Usuario',
    redirectPath: '/dashboard/users',
    onSuccess: () => {
      router.push('/dashboard/users');
    },
    onError: (error) => {
      alert('Error al eliminar el usuario');
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getUserById(userId);
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          console.error('Error al cargar usuario:', result.error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  const openDeleteModalWithUser = () => {
    openDeleteModal(user);
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <>
      <Box>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-people-fill me-2" />
            <h4 className="mb-0">Usuario: {user?.name}</h4>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/users/${userId}/edit`)}
            >
              <i className="bi bi-pencil me-1"></i>
              Editar
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={openDeleteModalWithUser}
            >
              <i className="bi bi-trash me-1"></i>
              Eliminar
            </Button>
          </div>
        </div>
        <Divider />
        <p className="text-muted mb-0">{user?.email}</p>
      </Box>

      <Box>
        <h5>Información del Usuario</h5>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Rol:</strong> {user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
            <p><strong>Verificación:</strong> {user?.verificationStatus}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Teléfono:</strong> {user?.phone || 'No especificado'}</p>
            <p><strong>Fecha de creación:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Box>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={() => {
          if (entityToDelete) {
            handleDelete();
          }
        }}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar el ${entityToDelete?.userType === 'admin' ? 'administrador' : 'operario'} "${entityToDelete?.name}"?`}
        isLoading={isDeleting}
      />
    </>
  );
}
