'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { withDashboardChart } from './withDashboardChart';
import { colors, tooltipStyle } from './theme';
import type { CategoryDistribution } from '@/types/dashboard';

function InnerCategoryDistributionChart({ data }: { data: CategoryDistribution[] }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div style={tooltipStyle}>
          <p className="mb-1"><strong>{d.name}</strong></p>
          <p style={{ color: d.color }}>Items: {d.value}</p>
          <p style={{ color: d.color }}>Porcentaje: {d.payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="d-flex align-items-center">
          <div style={{ width: 12, height: 12, backgroundColor: entry.color, marginRight: 8, borderRadius: 2 }} />
          <span style={{ fontSize: '0.875rem' }}>{entry.payload.category}</span>
        </div>
      ))}
    </div>
  );

  const colorPalette = [
    colors.blue, colors.green, colors.amber, colors.sky,
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const chartData = data.map((item) => ({
    ...item,
    name: item.category,
    value: item.itemCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="40%"
          labelLine={false}
          label={false}
          outerRadius={90}
          fill="#8884d8"
          dataKey="itemCount"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const WrappedCategoryChart = withDashboardChart(
  InnerCategoryDistributionChart,
  'No hay datos de categorías disponibles',
  'bi-pie-chart'
);

interface CategoryDistributionChartProps {
  data: CategoryDistribution[];
}

export default function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  return (
    <WrappedCategoryChart data={data || []} loading={false} error={null} />
  );
}
