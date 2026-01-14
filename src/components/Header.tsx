'use client';

import BoxStretched from './BoxStretched';
// import { usePathname } from 'next/navigation';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { Stack } from 'react-bootstrap';
import Link from 'next/link';
import 'bootstrap-icons/font/bootstrap-icons.css';
import LogoutButton from './logout';
// import { useRouter } from 'next/navigation';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export default function PageHeader() {
  // Removed unused router and pathname to silence lint warnings
  return (
    <BoxStretched>
      <Stack direction="horizontal" className="w-100 justify-content-between align-items-center">
        <button
          type="button"
          className="btn btn-link p-0 me-2 d-md-none"
          title="Abrir menú"
          aria-label="Abrir menú"
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent('sidebar:toggle'));
            } catch (error) {
              console.error('Error dispatching sidebar toggle event:', error);
            }
          }}
        >
          <i className="bi bi-list fs-4" />
        </button>
        <Breadcrumbs />

        <div className="d-flex align-items-center gap-3">
          <Link href="/dashboard/profile" className="text-dark" title="Perfil">
            <i className="bi bi-person-circle fs-5" />
          </Link>
          
          <LogoutButton />
        </div>
      </Stack>
    </BoxStretched>
  );
}

function Breadcrumbs() {
  const { segments, loading } = useBreadcrumbs();

  if (loading) {
    return (
      <Breadcrumb>
        <Breadcrumb.Item>
          <span className="text-muted">Cargando...</span>
        </Breadcrumb.Item>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      {segments.map((segment) => {
        return segment.isLast ? (
          <Breadcrumb.Item key={segment.id} active>
            {segment.label}
          </Breadcrumb.Item>
        ) : (
          <li key={segment.id} className="breadcrumb-item">
            <Link href={segment.href} className="text-decoration-none">
              {segment.label}
            </Link>
          </li>
        );
      })}
    </Breadcrumb>
  );
}
