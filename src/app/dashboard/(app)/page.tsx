import DashboardClient from '../DashboardView';
import { getDashboardKPIs, getMonthlyActivity, getCategoryDistribution, getBackupStatus } from '@/actions/dashboard';
import { getBackupStatusByUser } from '@/actions/states';
import { getCategoriesWithItemCount } from '@/actions/categories';

export const dynamic = 'force-dynamic';

export default async function DashboardIndexPage() {
  // Fetch all dashboard data using server actions (filtered by organizationId)
  const [kpis, monthlyActivity, categoryDistribution, backupStatus, backupStatusByUser, categoriesResult] = await Promise.all([
    getDashboardKPIs(),
    getMonthlyActivity(12),
    getCategoryDistribution(),
    getBackupStatus(),
    getBackupStatusByUser(6),
    getCategoriesWithItemCount()
  ]);

  const pieData = categoriesResult.success ? 
    categoriesResult.categories
      .map((c: any) => ({ name: c.name, value: c.itemCount || 0 }))
      .filter((d: { name: string; value: number }) => d.value > 0) :
    [];

  return (
    <DashboardClient 
      pieData={pieData}
      kpis={kpis}
      monthlyActivity={monthlyActivity}
      categoryDistribution={categoryDistribution}
      backupStatus={backupStatus}
      backupStatusByUser={backupStatusByUser}
    />
  );
}


