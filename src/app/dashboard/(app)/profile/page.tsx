import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import ProfilePageClient from '../../profile/ProfilePageClient';
import { verifyAdminJWT } from '@/lib/auth/admin/jwt';
import { adminAuthConfig } from '@/lib/auth/admin/config';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminAuthConfig.cookieName)?.value;
  
  if (!token) {
    return null;
  }

  const payload = await verifyAdminJWT(token);
  
  if (!payload?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { 
      id: true,
      name: true,
      email: true, 
      role: true,
      phone: true,
      signsWithCertificate: true, 
      verificationStatus: true, 
      kycURL: true,
      signatureID: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    },
  });

  if (!user) {
    return null;
  }
  
  return <ProfilePageClient user={user} />;
}
