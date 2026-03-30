import { cookies } from 'next/headers';
import { verifyAdminJWT } from '@/lib/auth/admin/jwt';
import { adminAuthConfig } from '@/lib/auth/admin/config';
import { prisma } from '@/lib/prisma';
import AppShell from './AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminAuthConfig.cookieName)?.value;
  let logoUrl: string | null = null;

  if (token) {
    const payload = await verifyAdminJWT(token);
    if (payload?.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: payload.organizationId },
        select: { logoUrl: true },
      });
      logoUrl = org?.logoUrl ?? null;
    }
  }

  return <AppShell logoUrl={logoUrl}>{children}</AppShell>;
}
