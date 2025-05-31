// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Protected route: /dashboard and its subpaths
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Auth routes: /login, /signup, /forgot-password, /auth/update-password
  const authPages = ['/login', '/signup', '/forgot-password', '/auth/update-password'];
  if (session && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow Supabase auth callback to proceed
  if (pathname.startsWith('/auth/callback')) {
    // The supabase client in createMiddlewareClient handles cookie updates if needed.
    // The actual code exchange happens in the route handler for /auth/callback.
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/auth/update-password',
    '/auth/callback/:path*', // Ensure callback with potential subpaths is matched
    // Add other paths that need session data or protection
  ],
};
