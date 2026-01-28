'use client';

import { useTranslations } from 'next-intl';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

interface Item {
  id: string;
  name: string;
  description?: string | null;
}

interface ItemSelectionTableProps {
  items: Item[];
  selectedItemIds: string[];
  onToggleItem: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function ItemSelectionTable({
  items,
  selectedItemIds,
  onToggleItem,
  search,
  onSearchChange,
  selectedCount,
  onSelectAll,
  onClearSelection,
}: ItemSelectionTableProps) {
  const t = useTranslations('common');
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Control
          type="text"
          placeholder="Buscar por nombre, ID o descripción"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="small text-muted">
          {items.length} productos encontrados · {selectedCount} seleccionados
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onSelectAll}
          >
            Seleccionar todos (filtro)
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClearSelection}
          >
            Limpiar selección
          </Button>
        </div>
      </div>
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #eee',
          borderRadius: 4,
        }}
      >
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Nombre</th>
              <th>ID</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedItemIds.includes(it.id)}
                    onChange={() => onToggleItem(it.id)}
                  />
                </td>
                <td>{it.name}</td>
                <td className="text-muted small">{it.id}</td>
                <td className="text-truncate" style={{ maxWidth: 240 }}>
                  <span title={it.description || ''}>
                    {it.description || <span className="text-muted">{t('noDescription')}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

