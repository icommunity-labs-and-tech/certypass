'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

type RootContainerProps = {
  children: React.ReactNode;
};

export default function RootContainer({ children }: RootContainerProps) {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return <div className="root-container">{children}</div>;
}


