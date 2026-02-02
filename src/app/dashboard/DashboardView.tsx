'use client';

import { useEffect, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
import DashboardKPIs from '@/components/charts/DashboardKPIs';
import MonthlyActivityChart from '@/components/charts/MonthlyActivityChart';
import CategoryDistributionChart from '@/components/charts/CategoryDistributionChart';
import { BackupStatusByUserChart } from '@/components/charts/BackupStatusByUserChart';
import { useTutorialContext } from '@/lib/tutorial/TutorialProvider';
import { shouldShowTour } from '@/lib/tutorial/tutorialStorage';
import { TOUR_IDS, sidebarTour } from '@/lib/tutorial/tutorialConfig';
import { useSidebar } from '@/components/SidebarContext';
import type { DashboardKPIs as DashboardKPIsType, MonthlyActivity, CategoryDistribution, BackupStatus, BackupStatusByUser } from '@/types/dashboard';

interface DashboardClientProps {
  pieData?: { name: string; value: number }[];
  kpis: DashboardKPIsType;
  monthlyActivity: MonthlyActivity[];
  categoryDistribution: CategoryDistribution[];
  backupStatus?: BackupStatus[];
  backupStatusByUser: BackupStatusByUser[];
}

export default function DashboardClient({
  pieData: _pieData,
  kpis,
  monthlyActivity,
  categoryDistribution,
  backupStatus: _backupStatus,
  backupStatusByUser
}: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const { startTour } = useTutorialContext();
  const { isDesktop, isOpenMobile, toggle } = useSidebar();
  const hasStartedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Activar tour del sidebar automáticamente en primera visita
  // En móvil, abrir el sidebar primero para que los elementos sean visibles
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar inmediatamente si ya iniciamos o está completado
    if (hasStartedRef.current) return;
    if (!shouldShowTour(TOUR_IDS.SIDEBAR_TOUR)) return;

    // Marcar como iniciado ANTES de crear el timeout para evitar duplicados
    hasStartedRef.current = true;

    const startTutorial = () => {
      const firstStep = sidebarTour[0];
      if (firstStep?.element) {
        const element = document.querySelector(firstStep.element as string);
        if (element) {
          startTour(TOUR_IDS.SIDEBAR_TOUR, sidebarTour);
        }
      }
    };

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // En móvil, abrir el sidebar antes de iniciar el tutorial
    if (!isDesktop && !isOpenMobile) {
      toggle(); // Abrir sidebar
      // Esperar a que el sidebar se abra y luego iniciar el tutorial
      timeoutRef.current = setTimeout(startTutorial, 2500);
    } else {
      // En desktop o si el sidebar ya está abierto, esperar el delay normal
      timeoutRef.current = setTimeout(startTutorial, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  // Solo ejecutar una vez al montar el componente
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Row className="mb-2">
        <Col md={12}>
          <Box>
            <BoxTitle message={t('metrics')} />
            <DashboardKPIs kpis={kpis} />
          </Box>
        </Col>
      </Row>

      <Row className="mb-2">
        <Col md={6}>
          <Box>
            <BoxTitle message={t('monthlyActivityTitle')} />
            <MonthlyActivityChart data={monthlyActivity} />
          </Box>
        </Col>
        <Col md={6}>
          <Box>
            <BoxTitle message={t('categoryDistributionTitle')} />
            <CategoryDistributionChart data={categoryDistribution} />
          </Box>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Box>
            <BoxTitle message={t('backupStatusByUserTitle')} />
            <BackupStatusByUserChart data={backupStatusByUser} />
          </Box>
        </Col>
      </Row>
    </>
  );
}