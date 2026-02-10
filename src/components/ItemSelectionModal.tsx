'use client';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ItemSelectionTable from './ItemSelectionTable';
import { useItemSelection } from '@/hooks/useItemSelection';
import { useEffect } from 'react';

interface ItemSelectionModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  footer?: (selectedItemIds: string[], items: any[]) => React.ReactNode;
  children?: React.ReactNode;
  autoLoad?: boolean;
  onItemsLoaded?: (items: any[]) => void;
}

export default function ItemSelectionModal({
  show,
  onHide,
  title,
  footer,
  children,
  autoLoad = true,
  onItemsLoaded,
}: ItemSelectionModalProps) {
  const {
    items,
    filteredItems,
    selectedItemIds,
    search,
    setSearch,
    isLoadingItems,
    selectedCount,
    toggleItem,
    selectAllFiltered,
    clearSelection,
    loadItems,
    reset,
  } = useItemSelection();

  useEffect(() => {
    if (show && autoLoad) {
      loadItems().then((loadedItems) => {
        if (onItemsLoaded) {
          onItemsLoaded(loadedItems);
        }
      });
    } else if (!show) {
      reset();
    }
  }, [show, autoLoad, loadItems, reset, onItemsLoaded]);

  const defaultFooter = (
    <>
      <Button variant="secondary" onClick={onHide}>
        Cancelar
      </Button>
    </>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-check2-square"></i>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoadingItems ? (
          <div className="text-center py-3">Cargando productos...</div>
        ) : (
          <>
            {children}
            <ItemSelectionTable
              items={filteredItems}
              selectedItemIds={selectedItemIds}
              onToggleItem={toggleItem}
              search={search}
              onSearchChange={setSearch}
              selectedCount={selectedCount}
              onSelectAll={selectAllFiltered}
              onClearSelection={clearSelection}
            />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {footer ? footer(selectedItemIds, items) : defaultFooter}
      </Modal.Footer>
    </Modal>
  );
}

// Exportar también el hook para acceso directo si se necesita
export { useItemSelection };

