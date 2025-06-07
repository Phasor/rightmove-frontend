'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export async function signOut() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0, path: '/' });
        },
      },
    }
  );
  
  // Sign out on the server
  await supabase.auth.signOut();
  
  // Get all cookies and aggressively clear any that might be auth-related
  const allCookies = cookieStore.getAll();
  
  // Clear all Supabase-related cookies with various path configurations
  allCookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || 
        cookie.name.includes('supabase') || 
        cookie.name.includes('auth-token') ||
        cookie.name.includes('access-token') ||
        cookie.name.includes('refresh-token')) {
      
      // Clear with multiple path configurations to ensure removal
      cookieStore.set(cookie.name, '', { 
        maxAge: 0, 
        path: '/',
        domain: undefined,
        secure: false,
        httpOnly: false,
        sameSite: 'lax'
      });
      
      cookieStore.set(cookie.name, '', { 
        maxAge: 0, 
        path: '/',
        expires: new Date(0)
      });
    }
  });
  
  // Also try to clear common auth cookie names that might exist
  const commonAuthCookies = [
    'sb-access-token',
    'sb-refresh-token', 
    'supabase-auth-token',
    'supabase.auth.token'
  ];
  
  commonAuthCookies.forEach(cookieName => {
    cookieStore.set(cookieName, '', { 
      maxAge: 0, 
      path: '/',
      expires: new Date(0)
    });
  });
  
  // Redirect to home page
  redirect('/');
} 