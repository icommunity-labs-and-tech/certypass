'use client';

import { Row, Col } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
import DashboardKPIs from '@/components/charts/DashboardKPIs';
import MonthlyActivityChart from '@/components/charts/MonthlyActivityChart';
import CategoryDistributionChart from '@/components/charts/CategoryDistributionChart';
import { BackupStatusByUserChart } from '@/components/charts/BackupStatusByUserChart';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { useTutorial } from '@/lib/tutorial/useTutorial';
import { TOUR_IDS, sidebarTour } from '@/lib/tutorial/tutorialConfig';
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
  const { logout } = useAuthSeparated();
  
  // Activar tour del sidebar automáticamente en primera visita
  useTutorial(TOUR_IDS.SIDEBAR_TOUR, sidebarTour, {
    autoStart: true,
    delay: 2000, // Esperar 2 segundos para que todo se renderice
  });

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