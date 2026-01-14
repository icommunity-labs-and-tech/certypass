import { useState, useMemo, useCallback } from 'react';

interface Item {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  [key: string]: any;
}

interface UseItemFilterOptions {
  searchFields?: (keyof Item)[];
}

export const useItemFilter = (
  items: Item[],
  options: UseItemFilterOptions = {}
) => {
  const { searchFields = ['name', 'categoryId', 'description'] } = options;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value && value.toLowerCase().includes(query);
      })
    );
  }, [items, searchQuery, searchFields]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    filteredItems,
    handleSearchChange,
    clearSearch,
  };
};
