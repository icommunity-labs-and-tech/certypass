'use client';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';
import { Badge } from 'react-bootstrap';
import Logo from './Logo';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { isDesktop, closeMobile } = useSidebar();
  const { user, loading } = useAuthSeparated();

  const navLinks = [
    { href: '/dashboard', icon: 'bi-house', label: 'Inicio' },
    { href: '/dashboard/status-types', icon: 'bi-collection', label: 'Estados' },
    { href: '/dashboard/items', icon: 'bi-list-columns', label: 'Productos' },
    { href: '/dashboard/users', icon: 'bi-people', label: 'Usuarios' },
    { href: '/dashboard/profile', icon: 'bi-person', label: 'Perfil' },
  ];

  // Links de gestión según rol
  const managementLinks = [];
  
  // Organizaciones: solo visible para SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    managementLinks.push({
      href: '/dashboard/organizations',
      icon: 'bi-building',
      label: 'Organizaciones',
      badge: 'SUPER'
    });
  }

  const appLinks = [
    { href: '/customer', icon: 'bi-person-badge', label: 'App Cliente' },
    { href: '/operator?admin-access=true', icon: 'bi-tools', label: 'App Operador' },
  ];

  const developerLinks: Array<{ href: string; icon: string; label: string; external?: boolean }> = [
    { href: '/dashboard/developer/events', icon: 'bi-calendar-event', label: 'Eventos', external: false },
    { href: '/dashboard/developer/webhooks', icon: 'bi-box-arrow-up-right', label: 'Webhooks', external: false },
    { href: '/dashboard/developer/auth', icon: 'bi-key', label: 'Auth', external: false },
    { href: '/api/v1/docs', icon: 'bi-book', label: 'API Docs', external: true },
  ];

  const handleNavClick = () => {
    // Solo cerrar en móvil, no en desktop
    if (!isDesktop) {
      closeMobile();
    }
  };

  return (
    <Container fluid className="sidebar-wrap min-vh-100 p-3 d-flex flex-column" data-tour="sidebar">
      <div className="px-2">
        <Navbar.Brand className="d-flex align-items-center mb-3">
          <Logo href="/dashboard" width={120} height={40} priority />
        </Navbar.Brand>
        <hr className="opacity-75 border" />
        <Nav className="flex-column mb-auto">
          {navLinks.map(({ href, icon, label }) => (
            <Nav.Link
              key={href}
              as={Link}
              href={href}
              className={`d-flex align-items-center px-3 py-2 rounded ${
                pathname === href ? 'bg-primary text-white' : 'text-dark'
              }`}
              style={{ transition: 'background-color 0.2s' }}
              onClick={handleNavClick}
            >
              <i className={`bi ${icon} me-2`} /> {label}
            </Nav.Link>
          ))}
        </Nav>
        
        {/* Sección de Gestión (solo si hay links disponibles para el rol) */}
        {!loading && managementLinks.length > 0 && (
          <>
            <hr className="opacity-75 border" />
            <div className="mb-2">
              <small className="text-muted px-3">GESTIÓN</small>
            </div>
            <Nav className="flex-column mb-3">
              {managementLinks.map(({ href, icon, label, badge }) => (
                <Nav.Link
                  key={href}
                  as={Link}
                  href={href}
                  className={`d-flex align-items-center justify-content-between px-3 py-2 rounded ${
                    pathname === href ? 'bg-warning text-dark' : 'text-dark'
                  }`}
                  style={{ transition: 'background-color 0.2s' }}
                  onClick={handleNavClick}
                >
                  <span>
                    <i className={`bi ${icon} me-2`} /> {label}
                  </span>
                  {badge && (
                    <Badge 
                      bg={badge === 'SUPER' ? 'danger' : 'warning'} 
                      text={badge === 'SUPER' ? 'white' : 'dark'}
                      className="ms-2"
                      style={{ fontSize: '0.65rem' }}
                    >
                      {badge}
                    </Badge>
                  )}
                </Nav.Link>
              ))}
            </Nav>
          </>
        )}
        
        <hr className="opacity-75 border" />
        <div className="mb-2">
          <small className="text-muted px-3" data-tour="developer-section">DESARROLLADOR</small>
        </div>
        <Nav className="flex-column mb-3">
          {developerLinks.map(({ href, icon, label, external }) => (
            external ? (
              <Nav.Link
                key={href}
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center px-3 py-2 rounded text-dark"
                style={{ transition: 'background-color 0.2s' }}
              >
                <i className={`bi ${icon} me-2`} /> {label}
              </Nav.Link>
            ) : (
              <Nav.Link
                key={href}
                as={Link}
                href={href}
                className={`d-flex align-items-center px-3 py-2 rounded ${
                  pathname === href || pathname.startsWith(href) 
                    ? 'bg-info text-white' : 'text-dark'
                }`}
                style={{ transition: 'background-color 0.2s' }}
                onClick={handleNavClick}
              >
                <i className={`bi ${icon} me-2`} /> {label}
              </Nav.Link>
            )
          ))}
        </Nav>

        <hr className="opacity-75 border" />
        <div className="mb-2">
          <small className="text-muted px-3" data-tour="applications-section">APLICACIONES</small>
        </div>
        <Nav className="flex-column">
          {appLinks.map(({ href, icon, label }) => (
            <Nav.Link
              key={href}
              as={Link}
              href={href}
              className={`d-flex align-items-center px-3 py-2 rounded ${
                pathname === href ? 'bg-success text-white' : 'text-dark'
              }`}
              style={{ transition: 'background-color 0.2s' }}
              onClick={handleNavClick}
            >
              <i className={`bi ${icon} me-2`} /> {label}
            </Nav.Link>
          ))}
        </Nav>
      </div>


    </Container>
  );
}
