import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = ['/dashboard', '/review', '/pattern', '/bulk', '/reports', '/users'];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const userRole = (token?.role as string | undefined) || '';

  // Protect the root "/" so unauthenticated users go straight to login
  const isRoot = nextUrl.pathname === '/';
  const isProtectedRoute = isRoot || protectedRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  );

  // If trying to access protected route without login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Role-based protection examples
  // Updated: Asesores can also configure patterns
  if (nextUrl.pathname.startsWith('/pattern') && !['asesor', 'coordinador', 'admin'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (nextUrl.pathname.startsWith('/users') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (nextUrl.pathname.startsWith('/bulk') && userRole !== 'coordinador') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)'],
};
