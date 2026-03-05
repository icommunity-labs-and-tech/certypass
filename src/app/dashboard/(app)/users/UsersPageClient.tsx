'use client';

import { useTranslations } from 'next-intl';
import UsersTable from '@/components/views/UsersTable';

export default function UsersPageClient() {
  const t = useTranslations('tables');
  return (
    <UsersTable
      title={t('users')}
      showBox={true}
    />
  );
}
