import type { TutorialStep } from './types';
import { TOUR_IDS } from './types';

// Re-exportar TOUR_IDS para facilitar el uso
export { TOUR_IDS };

/**
 * Tour del Sidebar - Explica los diferentes apartados del menú de navegación
 * Se muestra automáticamente en la primera visita al dashboard
 */
export const sidebarTour: TutorialStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Bienvenido a CertyPass',
      description: 'Este es el menú principal de navegación. Te guiaremos por las diferentes secciones disponibles.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"] .nav-link[href="/dashboard"]',
    popover: {
      title: 'Inicio',
      description: 'El dashboard principal donde verás un resumen de tus métricas, gráficos de actividad y estadísticas generales de tu organización.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"] .nav-link[href="/dashboard/status-types"]',
    popover: {
      title: 'Estados',
      description: 'Gestiona los tipos de estado que representan las diferentes etapas del ciclo de vida de tus productos certificados.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"] .nav-link[href="/dashboard/items"]',
    popover: {
      title: 'Productos',
      description: 'Administra tu inventario de productos. Crea, edita y gestiona todos tus productos certificados desde aquí.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"] .nav-link[href="/dashboard/users"]',
    popover: {
      title: 'Usuarios',
      description: 'Gestiona los usuarios de tu organización. Invita nuevos miembros y asigna roles (Administrador u Operador) y permisos.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"] a[href="/dashboard/profile"]',
    popover: {
      title: 'Perfil',
      description: 'Actualiza tu información personal y gestiona la verificación de identidad (KYC) de tu organización.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="developer-section"]',
    popover: {
      title: 'Desarrollador',
      description: 'Herramientas para desarrolladores: tokens de API para autenticación, eventos del sistema, webhooks para notificaciones y documentación de la API REST.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="applications-section"]',
    popover: {
      title: 'Aplicaciones',
      description: 'Acceso rápido a la aplicación Cliente (para verificar productos con QR) y la aplicación Operador (para gestionar productos en campo).',
      side: 'right',
      align: 'start',
    },
  },
];

/**
 * Configuración de tours disponibles
 */
export const tourConfigs = {
  [TOUR_IDS.SIDEBAR_TOUR]: {
    title: 'Tour del Menú',
    description: 'Conoce las secciones principales del sistema',
    steps: sidebarTour,
  },
} as const;
