'use client';

import { Row, Col } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
import DashboardKPIs from '@/components/charts/DashboardKPIs';
import MonthlyActivityChart from '@/components/charts/MonthlyActivityChart';
import CategoryDistributionChart from '@/components/charts/CategoryDistributionChart';
import { BackupStatusByUserChart } from '@/components/charts/BackupStatusByUserChart';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
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
  const { logout } = useAuthSeparated();
  
  // Verification notification hook removed - not currently used
  // const { showVerificationRequiredNotification, showVerificationErrorNotification } = useVerificationNotification();

  // handleLogout removed - not currently used
  // const handleLogout = async () => {
  //   await logout();
  //   // No necesitamos router.push porque logout ya maneja la redirección
  // };

  return (
    <>
      <Row className="mb-2">
        <Col md={12}>
          <Box>
            <BoxTitle message="Métricas" />
            <DashboardKPIs kpis={kpis} />
          </Box>
        </Col>
      </Row>

      <Row className="mb-2">
        <Col md={6}>
          <Box>
            <BoxTitle message="Actividad Mensual de Estados" />
            <MonthlyActivityChart data={monthlyActivity} />
          </Box>
        </Col>
        <Col md={6}>
          <Box>
            <BoxTitle message="Distribución por Categorías" />
            <CategoryDistributionChart data={categoryDistribution} />
          </Box>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Box>
            <BoxTitle message="Estado de Respaldos por Usuario" />
            <BackupStatusByUserChart data={backupStatusByUser} />
          </Box>
        </Col>
      </Row>
    </>
  );
}