'use client';

import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { Box, BoxHeader } from '@/components';
import { ItemCard } from '@/components/ItemCard';
import { OperatorItemsTable } from '@/components/OperatorItemsTable';
import { ViewToggle } from '@/components/ViewToggle';
import { PaginationControls } from '@/components/PaginationControls';
import { Toolbar } from '@/components/GenericTable/Toolbar';
import { getAllItems } from '@/actions/items';
import { UnifiedScannerButton } from '@/components';
import { usePagination } from '@/hooks/usePagination';
import { useItemFilter } from '@/hooks/useItemFilter';
import { OPERATOR_CONSTANTS, OPERATOR_MESSAGES, OPERATOR_BUTTONS } from '@/constants/operator';
import { useAdminOperatorAccess } from '@/hooks/useAdminOperatorAccess';
import './operator.css';

type Item = any;

export default function OperatorPage() {
  const { user, logout } = useAuthSeparated();
  const router = useRouter();
  const { clearAdminOperatorAccess } = useAdminOperatorAccess();

  // State
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  // Custom hooks
  const { searchQuery, filteredItems, handleSearchChange: filterSearchChange } = useItemFilter(itemsList, {
    searchFields: OPERATOR_CONSTANTS.SEARCH_FIELDS as any
  });

  const {
    page,
    hasMore,
    isMobile,
    isLoadingMore,
    paginatedItems,
    totalPages,
    setPage,
    loadMore,
    resetPagination,
    loadMoreRef,
  } = usePagination(filteredItems, {
    pageSize: OPERATOR_CONSTANTS.PAGE_SIZE,
    mobileBreakpoint: OPERATOR_CONSTANTS.MOBILE_BREAKPOINT,
  });

  // Effects
  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getAllItems();
        setItemsList(data);
      } catch (err) {
        console.error('Error cargando items:', err);
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadItems();
  }, []);


  // Handlers
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/auth/operator/login');
  }, [logout, router]);

  // Scanner functionality is now handled by the unified scanner page

  const handleItemSelect = useCallback((item: Item) => {
    router.push(`/operator/items/${item.id}`);
  }, [router]);


  const handleSearchChange = useCallback((query: string) => {
    filterSearchChange(query);
    resetPagination();
  }, [filterSearchChange, resetPagination]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, [setPage]);

  const handleViewChange = useCallback((view: 'grid' | 'table') => {
    // En móvil siempre usar grid
    if (isMobile) {
      setViewType('grid');
    } else {
      setViewType(view);
    }
  }, [isMobile]);


  const displayItems = isMobile ? filteredItems.slice(0, page * OPERATOR_CONSTANTS.PAGE_SIZE) : paginatedItems;

  // Forzar vista grid en móvil
  useEffect(() => {
    if (isMobile && viewType !== 'grid') {
      setViewType('grid');
    }
  }, [isMobile, viewType]);

  return (
    <Container id="main" fluid className="operator-page" role="main" aria-label="Aplicación de operador - Operador certypass">
      <Row className="mb-4 operator-header" role="region" aria-label="Encabezado y acciones">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="me-2">
              <h1 className="h3 mb-0">Operador certypass</h1>
              <p className="text-muted mb-0">Bienvenido, {user?.name}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <UnifiedScannerButton 
                appContext="operator"
                returnUrl="/operator"
                variant="primary"
                aria-label="Abrir escáner"
              >
                {OPERATOR_BUTTONS.START_SCAN}
              </UnifiedScannerButton>
              {user?.role === 'ADMIN' && (
                <Button variant="outline-primary" onClick={clearAdminOperatorAccess} aria-label="Volver al Dashboard" className="icon-button-mobile">
                  <i className="bi bi-speedometer2 me-md-2"></i>
                  <span className="d-none d-md-inline">Volver al Dashboard</span>
                </Button>
              )}
              <Button variant="outline-secondary" onClick={handleLogout} aria-label={OPERATOR_BUTTONS.LOGOUT} className="icon-button-mobile">
                <i className="bi bi-box-arrow-right me-md-2"></i>
                <span className="d-none d-md-inline">{OPERATOR_BUTTONS.LOGOUT}</span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>



      {/* Scanner functionality is now handled by the unified scanner page */}


      <Row className="mb-4">
        <Col>
          <Box>
            <div className="items-list-container">
              <BoxHeader title="">
                       <div className="d-flex align-items-center gap-2 w-100 justify-content-between" aria-label="Barra de búsqueda y filtros">
                         <div className="d-flex align-items-center gap-3">
                           <ViewToggle
                             currentView={viewType}
                             onViewChange={handleViewChange}
                             className="d-none d-md-flex"
                           />
                           <h5 className="mb-0">Inventario</h5>
                         </div>
                         <div className="d-flex align-items-center gap-2">
                           <Toolbar
                             filter={searchQuery}
                             onFilterChange={handleSearchChange}
                             selectedRow={null}
                             onActionClick={() => {}}
                             showAddButton={false}
                             onAddClick={() => {}}
                             filterPlaceholder="Buscar..."
                             className="mb-0"
                           />
                         </div>
                       </div>
              </BoxHeader>

              {isLoadingItems ? (
                <div className="text-center py-4" role="status" aria-live="polite">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">{OPERATOR_MESSAGES.LOADING_ITEMS}</p>
                </div>
              ) : filteredItems.length > 0 ? (
                viewType === 'grid' ? (
                  <div className="items-grid">
                    {displayItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onClick={handleItemSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <OperatorItemsTable
                    items={displayItems}
                    onItemSelect={handleItemSelect}
                  />
                )
              ) : (
                <div className="text-center py-4" role="region" aria-label="Estado vacío del listado de productos">
                  <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h6 className="empty-title">{OPERATOR_MESSAGES.NO_ITEMS}</h6>
                    <p className="empty-message">{OPERATOR_MESSAGES.NO_ITEMS_DESCRIPTION}</p>
                  </div>
                </div>
              )}

              <PaginationControls
                page={page}
                totalPages={totalPages}
                hasMore={hasMore}
                isMobile={isMobile}
                isLoadingMore={isLoadingMore}
                onPageChange={handlePageChange}
                onLoadMore={loadMore}
                loadMoreRef={loadMoreRef}
              />
            </div>
          </Box>
        </Col>
      </Row>
    </Container>
  );
}

