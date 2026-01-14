'use client';

import { Card, Col, Row } from 'react-bootstrap';
import { KPI_CONFIG } from '@/config/dashboardConfig';
import type { DashboardKPIs } from '@/types/dashboard';
import '../Box.css';
import './KpiGroup.css';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: 'primary' | 'success' | 'warning' | 'info';
  icon: string;
}

function KPICard({ title, value, subtitle, color, icon }: KPICardProps) {
  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'kpi-accent-1';
      case 'success': return 'kpi-accent-2';
      case 'warning': return 'kpi-accent-3';
      case 'info': return 'kpi-accent-1';
      default: return 'kpi-accent-1';
    }
  };

  return (
    <Col md={3} className="mb-3">
      <Card className={`glass-card kpi-card ${getColorClass()} border-0`}>
        <Card.Body className="py-3 d-flex flex-column align-items-center justify-content-center">
          <div className="kpi-icon mb-2">
            <i className={`bi ${icon} fs-4`}></i>
          </div>
          <div className="kpi-value mb-1">{value}</div>
          <small className="kpi-label text-center">{title}</small>
          {subtitle && <small className="kpi-subtitle text-muted">{subtitle}</small>}
        </Card.Body>
      </Card>
    </Col>
  );
}

interface DashboardKPIsProps {
  kpis: DashboardKPIs;
}

export default function DashboardKPIs({ kpis }: DashboardKPIsProps) {
  return (
    <Row className="text-center">
      <KPICard
        title={KPI_CONFIG.totalItems.title}
        value={KPI_CONFIG.totalItems.getValue(kpis)}
        subtitle={KPI_CONFIG.totalItems.subtitle}
        color={KPI_CONFIG.totalItems.color}
        icon={KPI_CONFIG.totalItems.icon}
      />
      
      <KPICard
        title={KPI_CONFIG.backupRate.title}
        value={KPI_CONFIG.backupRate.getValue(kpis)}
        subtitle={typeof KPI_CONFIG.backupRate.subtitle === 'function' ? KPI_CONFIG.backupRate.subtitle(kpis) : KPI_CONFIG.backupRate.subtitle}
        color={KPI_CONFIG.backupRate.color}
        icon={KPI_CONFIG.backupRate.icon}
      />
      
      <KPICard
        title={KPI_CONFIG.operators.title}
        value={KPI_CONFIG.operators.getValue(kpis)}
        subtitle={KPI_CONFIG.operators.subtitle}
        color={KPI_CONFIG.operators.color}
        icon={KPI_CONFIG.operators.icon}
      />
      
      <KPICard
        title={KPI_CONFIG.activeUsers.title}
        value={KPI_CONFIG.activeUsers.getValue(kpis)}
        subtitle={KPI_CONFIG.activeUsers.subtitle}
        color={KPI_CONFIG.activeUsers.color}
        icon={KPI_CONFIG.activeUsers.icon}
      />
    </Row>
  );
}
