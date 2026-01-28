"use client";

import Box from '@/components/Box';
import GenericTable, { FormTemplate } from '@/components/GenericTable';
import LoadingOverlay from '@/components/Loading';
import DynamicFieldBuilder from '@/components/DynamicFieldBuilder';
import { addCategory, getCategories, deleteCategory, getCategoryDetails } from '@/actions/categories';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getListColumnPresets } from '@/components/GenericTable/useUnifiedColumns';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useDeleteEntity } from '@/hooks/useDeleteEntity';
import { getCascadeInfo } from '@/config/entityConfig';
import { useTranslations } from 'next-intl';

// Función helper para crear el template de categorías con traducciones
const createCategoryFormTemplate = (tForms: (key: string) => string): FormTemplate => [
  { name: 'name', label: tForms('labels.name'), type: 'text' as const, placeholder: tForms('labels.name'), required: true },
  { name: 'description', label: tForms('labels.description'), type: 'text' as const, placeholder: tForms('labels.description'), required: true },
];

interface CategoriesTableProps {
  title?: string;
  showBox?: boolean;
  onCategorySelect?: (category: any) => void;
  customActions?: Array<{ label: string; onClick: (row: any) => void }>;
  customColumns?: Array<{ key: string; label: string; render: (category: any) => React.ReactNode }>;
  allowTemplateEditing?: boolean;
}

export default function CategoriesTable({ 
  title,
  showBox = true,
  onCategorySelect,
  customActions = [],
  customColumns = [],
  allowTemplateEditing = true 
}: CategoriesTableProps) {
  const t = useTranslations('categories');
  const tForms = useTranslations('forms');
  const tTables = useTranslations('tables');
  const tCommon = useTranslations('common.actions');
  const defaultTitle = title || t('title');
  const categoryFormTemplate = useMemo(() => createCategoryFormTemplate(tForms), [tForms]);
  const listColumnPresets = useMemo(() => getListColumnPresets(tTables), [tTables]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Usar el hook refactorizado
  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  } = useDeleteEntity(deleteCategory, {
    entityName: 'Categoría',
    redirectPath: '/dashboard/categories',
    onSuccess: () => {
      // Actualizar la lista local después de eliminar
      if (entityToDelete) {
        setCategories(prev => prev.filter(cat => cat.id !== entityToDelete.id));
      }
    },
    onError: (error) => {
      alert(t('deleteCategoryError'));
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (e) {
        console.error('Error loading categories:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const defaultActions: any[] = [
    // La acción "Ver detalle" se maneja con doble clic, no en el dropdown
  ];

  const openDeleteModalWithDetails = async (category: any) => {
    try {
      // Obtener información detallada de la categoría con nombres de dependencias
      const detailedCategory = await getCategoryDetails(category.id);
      openDeleteModal(detailedCategory);
    } catch (error) {
      console.error('Error obteniendo detalles de categoría:', error);
      // Si falla, usar la información básica
      openDeleteModal(category);
    }
  };

  const categoryColumns = listColumnPresets.categories.map(col => ({
    key: col.key,
    label: col.label,
    enableSorting: col.sortable !== false, // Por defecto true, a menos que se especifique false
    sortingFn: col.sortable !== false ? (a: any, b: any) => {
      const aValue = a.original[col.key];
      const bValue = b.original[col.key];
      
      // Ordenamiento especial para campos específicos
      if (col.key === 'itemCount') {
        const countA = a.original._count?.items || 0;
        const countB = b.original._count?.items || 0;
        return countA - countB;
      }
      
      return String(aValue).localeCompare(String(bValue));
    } : undefined,
    render: (category: any) => {
      const value = category[col.key];
      switch (col.key) {
        case 'name':
          return (
            <div>
              <strong className="text-primary">{category.name}</strong>
              {category.description && (
                <div className="small text-muted mt-1">
                  {category.description.length > 60
                    ? category.description.substring(0, 60) + '...'
                    : category.description
                  }
                </div>
              )}
            </div>
          );
        case 'itemCount':
          const count = category._count?.items || 0;
          return (
            <span className={`badge ${count > 0 ? 'bg-success' : 'bg-secondary'}`}>
              {count} item{count !== 1 ? 's' : ''}
            </span>
          );
        case 'actions':
          return (
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => router.push(`/dashboard/categories/${category.id}`)}
                title={t('viewDetail')}
              >
                <i className="bi bi-eye"></i>
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => router.push(`/dashboard/categories/${category.id}/edit`)}
                title={t('edit')}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => openDeleteModalWithDetails(category)}
                title={t('delete')}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          );
        default:
          return value || '-';
      }
    }
  }));

  if (isLoading) return <LoadingOverlay />;

  // Wrapper con validación para addCategory
  const handleAddCategory = async (formData: any) => {
    // Validar campos requeridos
    const errors: string[] = [];
    
    if (!formData.name || formData.name.trim() === '') {
      errors.push(t('nameRequired'));
    }
    
    if (!formData.description || formData.description.trim() === '') {
      errors.push(t('descriptionRequired'));
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
    
    const created = await addCategory(formData);
    setCategories(prev => [created, ...prev]);
    return created;
  };

  const tableContent = (
    <GenericTable
      initialData={categories}
      title={defaultTitle}
      icon="bi-tags"
      formTemplate={categoryFormTemplate}
      onAddSubmit={handleAddCategory}
      allowTemplateEditing={allowTemplateEditing}
      customColumns={customColumns.length > 0 ? customColumns : categoryColumns}
      actions={[...defaultActions, ...customActions]}
      filterPlaceholder={t('filterPlaceholder')}
      addButtonLabel={t('addButton')}
      customFormContent={({ formState, setFormState }) => (
        <DynamicFieldBuilder
          fields={formState.itemTemplate || []}
          onChange={(fields) => setFormState({ ...formState, itemTemplate: fields })}
          className="mt-3"
          showValidationErrors={false}
        />
      )}
    />
  );

  // Obtener información de cascada usando la configuración centralizada
  const cascadeInfo = entityToDelete ? getCascadeInfo(entityToDelete, 'categories') : undefined;

  return (
    <>
      {showBox ? <Box>{tableContent}</Box> : tableContent}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDelete}
        title={t('deleteCategory')}
        message={t('confirmDeleteCategory', { name: entityToDelete?.name || '' })}
        cascadeInfo={cascadeInfo}
        isLoading={isDeleting}
      />
    </>
  );
}
