'use client';

import Box from '@/components/Box';
import GenericTable, { FormTemplate } from '@/components/GenericTable';
import LoadingOverlay from '@/components/Loading';
import { getStates } from '@/actions/states';
import { getItems } from '@/actions/items';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listColumnPresets } from '@/components/GenericTable/useUnifiedColumns';
import { Divider } from '@/components/Divider';

interface StatesTableProps {
  title?: string;
  showBox?: boolean;
  onStateSelect?: (state: any) => void;
  customActions?: Array<{ label: string; onClick: (row: any) => void }>;
  customColumns?: Array<{ key: string; label: string; render: (state: any) => React.ReactNode }>;
}

export default function StatesTable({ 
  title = "Estados",
  showBox = true,
  onStateSelect,
  customActions = [],
  customColumns = []
}: StatesTableProps) {
  const [states, setStates] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Generar columnas usando el preset de states
  const stateColumns = listColumnPresets.states.map(col => ({
    key: col.key,
    label: col.label,
    render: (state: any) => {
      const value = state[col.key];
      
      // Renderizado especial para cada tipo de columna
      switch (col.key) {
        case 'status':
          return (
            <span className={`badge ${state.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
              {state.status}
            </span>
          );
        case 'itemId':
          const item = items.find(i => i.id === state.itemId);
          return item ? (
            <span className="badge bg-info">
              {item.name}
            </span>
          ) : '-';
        case 'description':
          return (
            <div>
              {state.description && state.description.length > 60 
                ? state.description.substring(0, 60) + '...' 
                : state.description
              }
            </div>
          );
        case 'actions':
          return (
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => router.push(`/dashboard/states/${state.id}`)}
                title="Ver detalle"
              >
                <i className="bi bi-eye"></i>
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => router.push(`/dashboard/states/${state.id}/edit`)}
                title="Editar"
              >
                <i className="bi bi-pencil"></i>
              </button>
            </div>
          );
        default:
          return value || '-';
      }
    }
  }));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statesData, itemsData] = await Promise.all([
          getStates(),
          getItems()
        ]);
        setStates(statesData);
        setItems(itemsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const defaultActions = [
    {
      label: 'Ver detalle',
      onClick: (row: Record<string, any>) => {
        if (onStateSelect) {
          onStateSelect(row);
        } else {
          router.push(`/dashboard/states/${row.id}`);
        }
      },
    }
  ];

  if (isLoading) return <LoadingOverlay />;

  const tableContent = (
    <>
      {showBox && (
        <Box>
          <h6 className="mb-2">¿Qué son los estados?</h6>
          <Divider />
          <p className="mb-0 text-muted">
            Los estados representan eventos o cambios importantes en el ciclo de vida de un item, como inspecciones, reparaciones, mantenimientos o verificaciones. 
            Cada estado puede incluir imágenes, descripciones detalladas y datos personalizados según el tipo de estado, y puede ser respaldado como evidencia verificable.
          </p>
        </Box>
      )}

      <GenericTable
      initialData={states}
      title={title}
      icon="bi-flag"
      allowTemplateEditing={false}
      customColumns={customColumns.length > 0 ? customColumns : stateColumns}
      actions={[...defaultActions, ...customActions]}
      filterPlaceholder="Filtrar por estado..."
      addButtonLabel="Añadir estado"
    />
    </>
  );

  if (showBox) {
    return <>{tableContent}</>;
  }

  return tableContent;
}
