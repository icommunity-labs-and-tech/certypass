'use client';

import { AuthProvider } from '@/hooks/useAuthSeparated';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
