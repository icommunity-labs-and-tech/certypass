'use client';

import UsersTable from '@/components/views/UsersTable';

export default function UsersPageClient() {
  return (
    <UsersTable 
      title="Gestión de Usuarios"
      showBox={true}
    />
  );
}
