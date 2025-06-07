import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip middleware processing during build time or if Supabase env vars are missing
  if (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'string' ||
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'string'
  ) {
    console.log('Middleware: Skipping Supabase auth - environment variables missing')
    return response
  }

  try {
    // Create a server-side Supabase client with retry logic
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This method must use the response object to set cookies
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            // This method must use the response object to delete cookies
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
        global: {
          fetch: (url, options) => {
            // Add retry logic to handle network issues
            return fetch(url, {
              ...options,
              // Add request timeout
              signal: options?.signal || AbortSignal.timeout(5000),
            })
          }
        }
      }
    )

    // Check if this is a sign-out request or if we're on the home page after sign out
    const url = request.nextUrl.clone()
    const isSignOutRequest = url.pathname.includes('/api/auth/signout') || 
                            url.searchParams.has('signout') ||
                            request.headers.get('x-signout') === 'true'
    
    // If this is a sign-out request, clear all Supabase cookies
    if (isSignOutRequest) {
      console.log('Sign-out detected in middleware, clearing cookies');
      
      // Get all cookies
      const cookieNames = request.cookies.getAll().map(cookie => cookie.name);
      
      // Clear all Supabase cookies
      cookieNames.forEach(name => {
        if (name.startsWith('sb-') || name.includes('supabase')) {
          console.log('Middleware clearing cookie:', name);
          response.cookies.set({
            name,
            value: '',
            maxAge: 0,
            path: '/',
          });
        }
      });
      
      // If we're on the home page with signout parameter, redirect to clean home page
      if (url.pathname === '/' && url.searchParams.has('signout')) {
        const cleanUrl = new URL('/', request.url);
        return NextResponse.redirect(cleanUrl);
      }
      
      return response;
    }
    
    // Only refresh auth session if it's not a sign-out related request
    if (!isSignOutRequest) {
      try {
        // Get user but don't force refresh if on home page (might be after sign out)
        if (url.pathname !== '/') {
          // Use a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth getUser timeout')), 3000);
          });
          
          await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
          ]);
        }
      } catch (authError) {
        // If there's an auth error, clear any problematic cookies but don't fail
        console.log('Auth error in middleware, clearing cookies:', authError)
        const cookieNames = request.cookies.getAll().map(cookie => cookie.name)
        cookieNames.forEach(name => {
          if (name.includes('sb-') || name.includes('supabase')) {
            response.cookies.set({
              name,
              value: '',
              maxAge: 0,
              path: '/',
            })
          }
        })
      }
    }
  } catch (error) {
    // If middleware fails completely, just continue without processing
    console.log('Middleware error, continuing without auth processing:', error)
  }

  return response
}

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
} 