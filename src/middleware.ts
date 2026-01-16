import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Configuración hardcodeada para evitar problemas con process.env en Edge Runtime
const ADMIN_JWT_SECRET = process.env.DASHBOARD_JWT_SECRET || process.env.JWT_SECRET || 'fallback-admin-secret';
const OPERATOR_JWT_SECRET = process.env.OPERATOR_JWT_SECRET || process.env.JWT_SECRET || 'fallback-operator-secret';

// Funciones simplificadas para el middleware (sin consultas a BD)
async function verifyAdminJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(ADMIN_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'certypass-admin',
      audience: 'certypass-dashboard',
    });
    
    if (payload.context !== 'admin' || payload.role !== 'ADMIN') {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

async function verifyOperatorJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(OPERATOR_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'certypass-operator',
      audience: 'certypass-operator-app',
    });
    
    if (payload.context !== 'operator' || payload.role !== 'USER') {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/auth/admin/login',
    '/auth/operator/login',
    '/auth/activate',
    '/auth/error',
    '/api/auth/admin',
    '/api/auth/operator',
    '/favicon.ico',
    '/_next',
    '/api/webhooks',
    '/api/docs',
    '/api/v1/docs',
    '/customer',
    '/checker',
    '/scanner',
    '/logout',
    '/apps',
  ];

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Manejar la ruta raíz - redirigir al selector de aplicaciones
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/apps', request.url));
  }

  // Rutas del dashboard (admin)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/admin/login?error=Unauthorized', request.url));
    }

    const user = await verifyAdminJWT(token);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/admin/login?error=AccessDenied', request.url));
    }

    return NextResponse.next();
  }

  // Rutas del operador
  if (pathname.startsWith('/operator')) {
    const token = request.cookies.get('operator-auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/operator/login?error=Unauthorized', request.url));
    }

    const user = await verifyOperatorJWT(token);
    
    if (!user || user.role !== 'USER') {
      return NextResponse.redirect(new URL('/auth/operator/login?error=AccessDenied', request.url));
    }

    return NextResponse.next();
  }

  // Rutas de autenticación - redirigir si ya está logueado
  if (pathname.startsWith('/auth/admin/')) {
    const token = request.cookies.get('admin-auth-token')?.value;
    
    if (token) {
      const user = await verifyAdminJWT(token);
      if (user && user.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    return NextResponse.next();
  }

  if (pathname.startsWith('/auth/operator/')) {
    const token = request.cookies.get('operator-auth-token')?.value;
    
    if (token) {
      const user = await verifyOperatorJWT(token);
      if (user && user.role === 'USER') {
        return NextResponse.redirect(new URL('/operator', request.url));
      }
    }
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
