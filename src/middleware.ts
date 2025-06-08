import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Check if this is a sign-out request
  const isSignOutRequest = req.nextUrl.pathname.includes('/logout') || 
                          req.nextUrl.searchParams.has('signout') ||
                          req.headers.get('x-signout') === 'true';
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // If this is a sign-out request, manually clear supabase cookies
  if (isSignOutRequest) {
    console.log('Sign-out detected in middleware, clearing cookies');
    
    // Get all cookies
    const cookieNames = req.cookies.getAll().map(cookie => cookie.name);
    
    // Clear all Supabase cookies
    cookieNames.forEach(name => {
      if (name.startsWith('sb-') || name.includes('supabase')) {
        console.log('Middleware clearing cookie:', name);
        res.cookies.set({
          name,
          value: '',
          maxAge: 0,
          path: '/',
        });
      }
    });
  } else {
    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession();
  }
  
  return res;
}

// Ensure the middleware is run for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 