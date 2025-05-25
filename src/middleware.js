import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  try {
    const path = request.nextUrl.pathname;

    // Always allow access to root path
    if (path === '/') {
      return NextResponse.next();
    }

    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    const isAuthenticated = !!token;
    const isAdmin = token?.role === 'ADMIN';

    // Skip middleware for API routes and static files
    if (path.startsWith('/api/') || 
        path.startsWith('/_next/') || 
        path.startsWith('/fonts/') || 
        path.startsWith('/icons/') ||
        /\.(ico|png|jpg|jpeg|svg|css|js)$/.test(path)) {
      return NextResponse.next();
    }

    // Public paths that don't require authentication
    const publicPaths = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/help',
      '/api/auth',
      '/verify-2fa',
      '/verify-email'
    ];

    // Admin-only paths
    const adminPaths = [
      '/admin',
      '/admin/settings',
      '/admin/users',
      '/admin/candidates',
      '/admin/positions',
      '/admin/election-status',
      '/admin/support-messages'
    ];

    // Allow public paths
    if (publicPaths.some(p => path.startsWith(p))) {
      // If user is already authenticated and tries to access login/register
      if (isAuthenticated && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    // Check authentication for protected routes
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(request.url));
      return NextResponse.redirect(loginUrl);
    }

    // Check admin access for admin routes
    if (path.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Ensure admin users can only access valid admin paths
      if (!adminPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    // Check if voting is allowed (based on time and user status)
    if (path.startsWith('/vote')) {
      try {
        const votingStatus = await fetch(new URL('/api/election/status', request.url));
        const { isActive } = await votingStatus.json();

        if (!isActive) {
          return NextResponse.redirect(new URL('/results', request.url));
        }
      } catch (error) {
        console.error('Failed to check voting status:', error);
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /icons (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|icons|[\\w-]+\\.\\w+).*)',
  ],
};