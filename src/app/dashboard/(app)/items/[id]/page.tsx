'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@/components/Box';
import LoadingOverlay from '@/components/Loading';
import { getItem, deleteItem, getItemDetails } from '@/actions/items';
import { getStatesByItem } from '@/actions/states';
import { Divider } from '@/components/Divider';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Button } from 'react-bootstrap';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import { getCascadeInfo } from '@/config/entityConfig';
import ItemQrModal from '@/components/ItemQrModal';
import ItemVerifyQrModal from '@/components/ItemVerifyQrModal';
import ItemStatesTable from '@/components/views/ItemStatesTable';
import { Row, Col } from 'react-bootstrap';
import ImageDisplay from '@/components/ImageDisplay';
import ItemSpecificFields from '@/components/ItemSpecificFields';
import ItemStatesMap from '@/components/ItemStatesMapClient';
import CategoryInputField from '@/components/CategoryInputField';
import AddStateForm from '@/components/AddStateForm';

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const itemId = id as string;
  const [item, setItem] = useState<any>(null);
  const [states, setStates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [showVerifyQr, setShowVerifyQr] = useState(false);
  const [showAddStateModal, setShowAddStateModal] = useState(false);

  // Usar el hook refactorizado
  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useDeleteEntity(deleteItem, {
    entityName: 'Producto',
    redirectPath: '/dashboard/items',
    onSuccess: () => {
      router.push('/dashboard/items');
    },
    onError: (error) => {
      alert('Error al eliminar el producto');
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!itemId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [itemData, statesData] = await Promise.all([
          getItem(itemId).catch((err) => {
            console.error('Error obteniendo item:', err);
            return null;
          }),
          getStatesByItem(itemId).catch((err) => {
            console.error('Error obteniendo estados:', err);
            return [];
          })
        ]);
        
        if (itemData) {
          setItem(itemData);
        }
        if (statesData) {
          setStates(statesData);
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [itemId]);

  const openDeleteModalWithDetails = async () => {
    try {
      // Obtener información detallada del item con nombres de dependencias
      const detailedItem = await getItemDetails(itemId);
      setItem(detailedItem);
      openDeleteModal(detailedItem);
    } catch (error) {
      console.error('Error obteniendo detalles del producto:', error);
      openDeleteModal(item);
    }
  };

  

  if (isLoading) return <LoadingOverlay />;

  if (!item) {
    return (
      <Box>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-list-columns me-2" />
            <h4 className="mb-0">Producto no encontrado</h4>
          </div>
        </div>
        <Divider />
        <p className="text-muted">No se pudo cargar la información del producto.</p>
      </Box>
    );
  }

  // Obtener información de cascada usando la configuración centralizada
  const cascadeInfo = entityToDelete ? getCascadeInfo(entityToDelete, 'items') : undefined;

  // Preparar columnas para la tabla de estados
  

  return (
    <>
      <Box>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-list-columns me-2" />
            <h4 className="mb-0">Producto: {item?.name}</h4>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowQr(true)}
              className="d-flex align-items-center gap-1"
            >
              <i className="bi bi-qr-code me-1"></i>
              QR
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setShowVerifyQr(true)}
              className="d-flex align-items-center gap-1"
              disabled={!itemId}
            >
              <i className="bi bi-shield-check me-1"></i>
              QR Verificación
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              href={`/customer/item/${encodeURIComponent(itemId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="d-flex align-items-center gap-1"
              disabled={!itemId}
            >
              <i className="bi bi-eye me-1"></i>
              Ver
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={openDeleteModalWithDetails}
              className="d-flex align-items-center gap-1"
            >
              <i className="bi bi-trash me-1"></i>
              Eliminar
            </Button>
          </div>
        </div>
        <Divider />
        
        <Row>
          <Col md={8}>
            <p className="text-muted mb-0">{item?.description}</p>
            
            {/* Campos específicos del item */}
            {item?.itemTemplate && item?.templateFields && (
              <div className="mt-4">
                <ItemSpecificFields
                  itemTemplate={Array.isArray(item.itemTemplate) ? item.itemTemplate : []}
                  templateFields={item.templateFields || {}}
                />
              </div>
            )}
          </Col>
          <Col md={4}>
            {item?.imageUrl && (
              <div className="d-flex justify-content-end">
                <ImageDisplay
                  imageUrl={item.imageUrl}
                  alt={`Imagen de ${item.name}`}
                  clickable={true}
                  modalTitle={`Imagen de ${item.name}`}
                  style={{ 
                    maxWidth: '150px', 
                    maxHeight: '150px',
                    width: '150px',
                    height: '150px'
                  }}
                />
              </div>
            )}
          </Col>
        </Row>

        <Divider />

        {/* Sección de verificación antifraude */}
        {item?.antifraudEvidenceId && (
          <>
            <div className="mt-4 mb-3">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-shield-check me-2 text-success"></i>
                <h5 className="mb-0">Verificación Antifalsificación</h5>
              </div>
              <div className="alert alert-success mb-0" role="alert">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Producto verificado</strong>
                    {item.antifraudEvidenceId !== 'NO_SIGNATURE' && (
                      <div className="mt-2">
                        <small className="text-muted">
                          ID de evidencia: <code>{item.antifraudEvidenceId}</code>
                        </small>
                      </div>
                    )}
                  </div>
                  {item.antifraudEvidenceId && item.antifraudEvidenceId !== 'NO_SIGNATURE' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      href={`https://checker.icommunitylabs.com/lookup/${item.antifraudEvidenceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      Ver evidencia
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Sección de categorías */}
        <CategoryInputField
          itemId={itemId}
          categories={item?.categories || []}
          onUpdate={(updatedCategories) => {
            setItem((prev: any) => ({
              ...prev,
              categories: updatedCategories,
            }));
          }}
        />
      </Box>

      {/* Se elimina el box de evidencia; la verificación se hace desde el botón del header */}

      <Box>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-flag me-2" />
            <h5 className="mb-0">Estados del Producto</h5>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddStateModal(true)}
            className="d-flex align-items-center gap-1"
          >
            <i className="bi bi-plus-circle me-1"></i>
            Añadir Estado
          </Button>
        </div>
        <Divider />
        <ItemStatesTable states={states as any} />
      </Box>

      {(() => {
        // Verificar si hay estados con geolocalización antes de renderizar
        const hasGeolocation = states.some((state: any) => {
          if (!state.templateConfig) return false;
          let templateConfig = state.templateConfig;
          if (typeof templateConfig === 'string') {
            try {
              templateConfig = JSON.parse(templateConfig);
            } catch {
              return false;
            }
          }
          // Buscar cualquier campo que tenga lat y lng
          return Object.values(templateConfig).some((value: any) =>
            value &&
            typeof value === 'object' &&
            'lat' in value &&
            'lng' in value &&
            typeof value.lat === 'number' &&
            typeof value.lng === 'number'
          );
        });

        if (!hasGeolocation) {
          return null;
        }

        return (
          <Box>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-geo-alt me-2" />
                <h5 className="mb-0">Seguimiento con geolocalización</h5>
              </div>
            </div>
            <Divider />
            <ItemStatesMap states={states as any} />
          </Box>
        );
      })()}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${entityToDelete?.name}"?`}
        cascadeInfo={cascadeInfo}
        isLoading={isDeleting}
      />

      <ItemQrModal
        show={showQr}
        onHide={() => setShowQr(false)}
        itemId={itemId}
        itemName={item?.name}
      />

      <ItemVerifyQrModal
        show={showVerifyQr}
        onHide={() => setShowVerifyQr(false)}
        itemId={itemId}
        itemName={item?.name}
      />

      {/* Modal para añadir estado */}
      {item && (
        <AddStateForm
          item={item}
          itemId={itemId}
          show={showAddStateModal}
          onHide={() => setShowAddStateModal(false)}
          onSuccess={async () => {
            setShowAddStateModal(false);
            // Recargar los estados después de crear uno nuevo
            try {
              const statesData = await getStatesByItem(itemId);
              setStates(statesData);
            } catch (err) {
              console.error('Error recargando estados:', err);
            }
          }}
          onStateCreated={async (newState) => {
            // También actualizar cuando se crea el estado
            setShowAddStateModal(false);
            try {
              const statesData = await getStatesByItem(itemId);
              setStates(statesData);
            } catch (err) {
              console.error('Error recargando estados:', err);
            }
          }}
        />
      )}
    </>
  );
}
