'use client'

import Box from '@/components/Box';
import { FormTemplate } from '@/components/GenericTable';
import LoadingOverlay from '@/components/Loading';
import ItemImageColumn from '@/components/ItemImageColumn';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ExportItemsBox from '@/components/ExportItemsBox';
import { getItems, addItem, deleteItem, getItemDetails } from '@/actions/items';
import { getCategories } from '@/actions/categories';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import { getCascadeInfo } from '@/config/entityConfig';
import ItemsTableCustom from './ItemsTableCustom';
import { Divider } from '@/components/Divider';
import CategoryEditor from '@/components/CategoryEditor';
 

// Template básico para items (campos fijos)
// Nota: Las categorías ahora se gestionan como tags en ItemCreationWizard, no como campo select
const baseItemFormTemplate: FormTemplate = [
  { name: 'customId', label: 'ID del Producto', type: 'text', placeholder: 'ID único del producto', required: true },
  { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Nombre del producto', required: true },
  { name: 'description', label: 'Descripción', type: 'text', placeholder: 'Descripción del producto' },
  { name: 'imageUrl', label: 'Imagen', type: 'image', placeholder: 'URL de la imagen' },
];

interface ItemsTableProps {
  title?: string;
  showBox?: boolean;
  onItemSelect?: (item: any) => void;
  customActions?: Array<{ label: string; onClick: (row: any) => void }>;
  customColumns?: Array<{ key: string; label: string; render: (item: any) => React.ReactNode }>;
  allowTemplateEditing?: boolean;
}

export default function ItemsTable({ 
  title = "Inventario de productos",
  showBox = true,
  onItemSelect,
  customActions = [],
  customColumns = [],
  allowTemplateEditing = true
}: ItemsTableProps) {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterType, setFilterType] = useState<'name' | 'id' | 'category'>('name');
  const router = useRouter();

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
    onSuccess: (deleted) => {
      // Actualizar la lista local inmediatamente con el id eliminado
      const deletedId = (deleted?.id || entityToDelete?.id);
      if (deletedId) {
        setItems(prev => prev.filter(item => item.id !== deletedId));
      }
    },
    onError: (error) => {
      alert('Error al eliminar el producto');
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsData, categoriesData] = await Promise.all([
          getItems(),
          getCategories()
        ]);
        setItems(itemsData);
        setProducts(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Los items se pasan sin filtrar, el filtrado se hace en ItemsTableCustom
  const filteredItems = items;

  // Función para generar etiqueta automáticamente del nombre
  const generateLabel = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Función para generar placeholder automáticamente
  const generatePlaceholder = (name: string, type: string): string => {
    const basePlaceholder = generateLabel(name);
    switch (type) {
      case 'number':
        return `Ej: 123`;
      case 'email':
        return `ejemplo@email.com`;
      case 'date':
        return `DD/MM/AAAA`;
      case 'select':
        return `Selecciona una opción`;
      case 'image':
        return `Selecciona una imagen`;
      default:
        return `Ingresa ${basePlaceholder.toLowerCase()}`;
    }
  };

  // Obtener el template de la categoría seleccionada
  // Nota: Las categorías ahora se gestionan como tags, pero aún podemos usar templates de categorías
  const getSelectedProductTemplate = (): FormTemplate => {
    // Si no hay categoría seleccionada, usar el template básico
    if (!selectedProductId) {
      return baseItemFormTemplate;
    }
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct || !selectedProduct.itemTemplate) return baseItemFormTemplate;

    // Verificar que itemTemplate sea un array
    let productTemplate: FormTemplate = [];
    
    try {
      if (Array.isArray(selectedProduct.itemTemplate)) {
        // Generar etiquetas y placeholders automáticamente
        productTemplate = selectedProduct.itemTemplate.map((field: any) => ({
          name: field.name,
          label: generateLabel(field.name),
          type: field.type || 'text',
          placeholder: generatePlaceholder(field.name, field.type || 'text'),
          required: field.required || false,
          options: field.type === 'select' && field.options 
            ? field.options.map((option: string) => ({ value: option, label: option }))
            : undefined,
        }));
      } else if (typeof selectedProduct.itemTemplate === 'object' && selectedProduct.itemTemplate !== null) {
        // Si es un objeto, convertirlo a FormTemplate
        productTemplate = Object.entries(selectedProduct.itemTemplate).map(([key, value]: [string, any]) => ({
          name: key,
          label: generateLabel(key),
          type: (value as any).type || 'text',
          placeholder: generatePlaceholder(key, (value as any).type || 'text'),
          required: (value as any).required || false,
          options: (value as any).type === 'select' && (value as any).options 
            ? (value as any).options.map((option: string) => ({ value: option, label: option }))
            : undefined,
        }));
      }
    } catch (error) {
       console.error('Error procesando template de la categoría:', error);
      return baseItemFormTemplate;
    }
    
    // Combinar los campos base con los campos específicos de la categoría
    return [...baseItemFormTemplate, ...productTemplate];
  };

  const openDeleteModalWithDetails = async (item: any) => {
    try {
      // Obtener información detallada del item con nombres de dependencias
      const detailedItem = await getItemDetails(item.id);
      openDeleteModal(detailedItem);
    } catch (error) {
      console.error('Error obteniendo detalles del producto:', error);
      // Si falla, usar la información básica
      openDeleteModal(item);
    }
  };

  // Removed defaultActions to eliminate contextual dropdown
  // Double-click navigation is handled by onRowDoubleClick

  const defaultColumns = [
    {
      key: 'item-name',
      label: 'Nombre del Producto',
      enableSorting: true,
      sortingFn: (a: any, b: any) => a.original.name.localeCompare(b.original.name),
      render: (item: any) => (
        <div>
          <strong className="text-primary">{item.name}</strong>
          {item.id && (
            <div className="small text-muted mt-1">
              ID: {item.id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'item-categories',
      label: 'Categorías',
      enableSorting: false,
      render: (item: any) => {
        const handleCategoryUpdate = (updatedCategories: Array<{ id: string; name: string }>) => {
          // Actualizar el item en la lista local
          setItems((prevItems) =>
            prevItems.map((i) =>
              i.id === item.id
                ? { ...i, categories: updatedCategories }
                : i
            )
          );
        };

        return (
          <CategoryEditor
            itemId={item.id}
            categories={item.categories || []}
            onUpdate={handleCategoryUpdate}
            compact={true}
          />
        );
      },
    },
    {
      key: 'item-created',
      label: 'Fecha de alta',
      enableSorting: true,
      sortingFn: (a: any, b: any) => {
        const dateA = new Date(a.original.createdAt);
        const dateB = new Date(b.original.createdAt);
        return dateA.getTime() - dateB.getTime();
      },
      render: (item: any) => {
        const date = new Date(item.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return (
          <div className="small">
            {formattedDate}
          </div>
        );
      },
    },
    {
      key: 'item-image',
      label: 'Imagen',
      enableSorting: false,
      render: (item: any) => {
        return <ItemImageColumn item={item} />;
      },
    },
    {
      key: 'item-actions',
      label: 'Acciones',
      enableSorting: false,
      render: (item: any) => (
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => router.push(`/dashboard/items/${item.id}`)}
            title="Ver detalle"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => openDeleteModalWithDetails(item)}
            title="Eliminar"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingOverlay/>;
  }

  // Wrapper para addItem que incluye el itemTemplate de la categoría
  const handleAddItem = async (formData: any) => {
    // Obtener el itemTemplate de la categoría seleccionada
    const selectedProduct = products.find(p => p.id === formData.categoryId);
    const categoryTemplate = selectedProduct?.itemTemplate || [];
    
    // Llamar a addItem con el itemTemplate correcto
    return await addItem(formData, categoryTemplate);
  };

  const tableContent = (
    <ItemsTableCustom 
      title={title}
      icon={"bi-list-columns"}
      initialData={filteredItems} 
      formTemplate={!isLoading && products.length > 0 ? getSelectedProductTemplate() : undefined}
      onAddSubmit={handleAddItem}
      uploadType="item"
      allowTemplateEditing={false}
      customColumns={[...defaultColumns, ...customColumns]}
      actions={customActions}
      filterPlaceholder={
        filterType === 'name' 
          ? "Buscar por nombre" 
          : filterType === 'id'
          ? "Buscar por ID"
          : "Buscar por categoría"
      }
      filterType={filterType}
      onFilterTypeChange={setFilterType}
      categories={products}
      addButtonLabel="Añadir producto"
      onCategoryChange={setSelectedProductId}
    />
  );

  // Obtener información de cascada usando la configuración centralizada
  const cascadeInfo = entityToDelete ? getCascadeInfo(entityToDelete, 'items') : undefined;

  return (
    <>
      {showBox && (
        <Box>
          <h6 className="mb-2">¿Qué es el inventario de productos?</h6>
          <Divider />
          <p className="mb-0 text-muted">
            El inventario de productos es el catálogo central de productos o elementos que gestiona tu organización. 
            Cada producto puede tener múltiples categorías, una imagen, campos personalizados según su tipo, y un historial de estados que registra su evolución a lo largo del tiempo.
          </p>
        </Box>
      )}

      <ExportItemsBox />

      <div className="mt-3">
        {showBox ? <Box>{tableContent}</Box> : tableContent}
      </div>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${entityToDelete?.name}"?`}
        cascadeInfo={cascadeInfo}
        isLoading={isDeleting}
      />
    </>
  );
}
