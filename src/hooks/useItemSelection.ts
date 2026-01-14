import { useState, useMemo, useCallback } from 'react';
import { getItems } from '@/actions/items';

export function useItemSelection() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it: any) => {
      return (
        it.name?.toLowerCase().includes(q) ||
        it.id?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const toggleItem = useCallback((id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllFiltered = useCallback(() => {
    const ids = filteredItems.map((it: any) => it.id);
    setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...ids])));
  }, [filteredItems, selectedItemIds]);

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setIsLoadingItems(true);
      const data = await getItems();
      const loadedItems = data || [];
      setItems(loadedItems);
      setSelectedItemIds(loadedItems.map((it: any) => it.id));
      return loadedItems;
    } catch (e) {
      console.error('Error cargando items', e);
      throw e;
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setSelectedItemIds([]);
    setSearch('');
  }, []);

  return {
    items,
    selectedItemIds,
    setSelectedItemIds,
    search,
    setSearch,
    isLoadingItems,
    filteredItems,
    selectedCount: selectedItemIds.length,
    toggleItem,
    selectAllFiltered,
    clearSelection,
    loadItems,
    reset,
  };
}

