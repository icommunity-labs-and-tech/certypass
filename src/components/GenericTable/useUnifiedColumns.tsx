import { useMemo } from 'react';
import { formatValueWithSmartDateDetection } from '@/lib/format';

export type ColumnFormat = 'text' | 'date' | 'datetime' | 'badge' | 'status' | 'number' | 'currency' | 'image' | 'custom' | 'relation' | 'action';

export interface UnifiedColumn {
  key: string;
  label: string;
  format?: ColumnFormat;
  width?: string;
  sortable?: boolean;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  relationData?: any[];
  relationKey?: string;
  relationDisplay?: string;
  customRender?: (value: any, row: any) => React.ReactNode;
}

export type TableContext = 'list' | 'detail';

// Presets para vistas de lista
const listColumnPresets: Record<string, UnifiedColumn[]> = {
  items: [
    { key: 'name', label: 'Nombre del Item', format: 'text', width: '250px', sortable: true },
    { key: 'status', label: 'Estado', format: 'status', width: '120px', sortable: true },
    { key: 'categoryId', label: 'Categoría', format: 'relation', width: '150px', sortable: true },
    { key: 'image', label: 'Imagen', format: 'image', width: '100px', sortable: false },
    { key: 'passport', label: 'Pasaporte', format: 'action', width: '120px', sortable: false }
  ],
  categories: [
    { key: 'name', label: 'Nombre de la Categoría', format: 'text', width: '250px', sortable: true },
    { key: 'itemCount', label: 'Items', format: 'number', width: '120px', sortable: true },
    { key: 'actions', label: 'Acciones', format: 'action', width: '120px', sortable: false }
  ],
  states: [
    { key: 'status', label: 'Estado', format: 'status', width: '120px', sortable: true },
    { key: 'itemId', label: 'Item', format: 'relation', width: '150px', sortable: true },
    { key: 'description', label: 'Descripción', format: 'text', width: '300px', sortable: true },
    { key: 'actions', label: 'Acciones', format: 'action', width: '120px', sortable: false }
  ],
  users: [
    { key: 'name', label: 'Nombre', format: 'text', width: '200px', sortable: true },
    { key: 'role', label: 'Rol', format: 'status', width: '120px', sortable: true },
    { key: 'createdAt', label: 'Creado', format: 'datetime', width: '150px', sortable: true },
    { key: 'actions', label: 'Acciones', format: 'action', width: '120px', sortable: false }
  ]
};

// Presets para vistas de detalle
const detailColumnPresets: Record<string, UnifiedColumn[]> = {
  itemStates: [
    { key: 'status', label: 'Estado', format: 'status', width: '120px' },
    { key: 'title', label: 'Título del Estado', format: 'text', width: '250px' },
    { key: 'description', label: 'Descripción', format: 'text', width: '300px' },
    { key: 'createdAt', label: 'Fecha de Creación', format: 'datetime', width: '150px' },
    { key: 'actions', label: 'Acciones', format: 'action', width: '100px' }
  ],
  categoryItems: [
    { key: 'name', label: 'Nombre del Item', format: 'text', width: '200px' },
    { key: 'status', label: 'Estado', format: 'status', width: '120px' },
    { key: 'createdAt', label: 'Fecha de Creación', format: 'datetime', width: '150px' },
    { key: 'actions', label: 'Acciones', format: 'action', width: '100px' }
  ]
};

// Formateadores unificados
const formatters: Record<ColumnFormat, (value: any, row: any, column?: UnifiedColumn) => React.ReactNode> = {
  text: (value) => {
    if (!value) return '-';
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }
    return value;
  },
  date: (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return (
      <span className="text-muted">
        {date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    );
  },
  datetime: (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return (
      <span className="text-muted">
        {date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    );
  },
  badge: (value) => {
    if (!value) return '-';
    return (
      <span className="badge bg-secondary">
        {value}
      </span>
    );
  },
  status: (value) => {
    if (!value) return '-';
    const badgeClass = value === 'active' ? 'bg-success' :
                      value === 'pending' ? 'bg-warning' :
                      value === 'completed' ? 'bg-info' : 'bg-secondary';
    return (
      <span className={`badge ${badgeClass}`}>
        {value}
      </span>
    );
  },
  number: (value) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('es-ES');
  },
  currency: (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  },
  image: (value) => {
    if (!value) return '-';
    return `[Imagen]`;
  },
  custom: (value) => value || '-',
  relation: (value, row, column) => {
    if (!column?.relationData || !column?.relationKey || !column?.relationDisplay) return value || '-';
    const relatedItem = column.relationData.find(item => item[column.relationKey!] === value);
    return relatedItem ? relatedItem[column.relationDisplay!] : value || '-';
  },
  action: (value) => value || '-'
};

export function useUnifiedColumns(
  data: any[],
  context: TableContext = 'list',
  preset?: string,
  customColumns?: UnifiedColumn[],
  relationData?: Record<string, any[]>
) {
  const allPresets = context === 'list' ? listColumnPresets : detailColumnPresets;
  
  const enhancedColumns = useMemo(() => {
    if (customColumns && customColumns.length > 0) {
      return customColumns;
    }

    if (preset && allPresets[preset]) {
      return allPresets[preset].map(col => ({
        ...col,
        relationData: relationData?.[col.key] || col.relationData
      }));
    }

    // Fallback: generar columnas automáticamente
    if (data.length > 0) {
      const sample = data[0];
      return Object.keys(sample)
        .filter(key => !['id', '__typename'].includes(key))
        .map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          format: 'text' as ColumnFormat,
          width: '150px'
        }));
    }

    return [];
  }, [data, context, preset, customColumns, relationData, allPresets]);

  const formatValue = (column: UnifiedColumn, value: any, row: any): React.ReactNode => {
    if (column.customRender) {
      return column.customRender(value, row);
    }
    
    const formatter = formatters[column.format || 'text'];
    return formatter(value, row, column);
  };

  return {
    columns: enhancedColumns,
    formatValue,
    presets: allPresets,
    context
  };
}

// Exportar presets para uso directo
export { listColumnPresets, detailColumnPresets };
