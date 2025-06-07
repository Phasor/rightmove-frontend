"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

// Debug function to test if supabase is properly imported
const debugSupabase = () => {
  console.log('=====================================');
  console.log('SUPABASE DEBUG INFO:');
  console.log('- Import check:', supabase ? 'Successfully imported' : 'Import failed');
  console.log('- Type:', typeof supabase);
  console.log('- Auth module:', supabase?.auth ? 'Available' : 'Missing');
  
  // Check for specific methods
  const methods = {
    signOut: typeof supabase?.auth?.signOut === 'function',
    getUser: typeof supabase?.auth?.getUser === 'function',
    onAuthStateChange: typeof supabase?.auth?.onAuthStateChange === 'function'
  };
  
  console.log('- Auth methods available:', methods);
  console.log('=====================================');
};

// Run debug immediately
debugSupabase();

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Test Supabase connection on component mount
    const testSupabaseConnection = async () => {
      console.log('Supabase client initialization check:');
      console.log('- Supabase object type:', typeof supabase);
      console.log('- Auth module available:', supabase?.auth ? 'Yes' : 'No');
      console.log('- Full Supabase client:', supabase);
      
      // Test an actual API call to verify connection
      try {
        const { error } = await supabase.from('_dummy_query_').select('*').limit(1);
        console.log('Supabase connection test:', error ? `Error: ${error.message}` : 'Connection successful');
        // The query might fail with table not found, but that's okay - we just want to test the connection
      } catch (e) {
        console.error('Supabase connection test failed:', e);
      }
    };
    
    testSupabaseConnection();

    // Add global error handler for unhandled promise rejections
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('UNHANDLED PROMISE REJECTION:', event.reason);
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    const getUser = async () => {
      setIsLoading(true);
      try {
        console.log('Checking Supabase client:', typeof supabase, supabase?.auth ? 'auth available' : 'auth missing');
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
        } else {
          console.log('Successfully fetched user data:', data.user?.id || 'No user found');
          setUser(data.user);
        }
      } catch (e) {
        console.error('Exception in getUser:', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    getUser();

    // Set up auth state listener to update user state when auth changes
    let subscription = { unsubscribe: () => {} };
    
    try {
      const authStateResult = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
          // Redirect to home page after successful sign out
          router.push('/');
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user || null);
          setIsLoading(false);
        }
      });
      
      if (authStateResult?.data?.subscription) {
        subscription = authStateResult.data.subscription;
      } else {
        console.warn('Auth state change listener returned unexpected structure:', authStateResult);
      }
    } catch (e) {
      console.error('Failed to setup auth state listener:', e);
    }

    // Clean up subscription on unmount
    return () => {
      try {
        subscription.unsubscribe();
        window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      } catch (e) {
        console.error('Error unsubscribing from auth state changes:', e);
      }
    };
  }, [router]);

  useEffect(() => {
    // Don't run redirect logic if we're loading or if this is a callback URL
    if (isLoading || pathname.includes('/auth/callback')) {
      return;
    }
    
    // Add a small delay to prevent race conditions during auth flow
    const redirectTimeout = setTimeout(() => {
      if (user) {
        if (pathname === "/sign-in") {
          console.log('Redirecting signed-in user from sign-in to dashboard');
          router.replace("/dashboard");
        }
      } else {
        if (pathname === "/dashboard") {
          console.log('Redirecting unauthenticated user from dashboard to sign-in');
          router.replace("/sign-in");
        }
      }
    }, 100); // Small delay to let auth state settle

    return () => clearTimeout(redirectTimeout);
  }, [user, pathname, router, isLoading]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      console.log('Starting HARDCORE sign out process');
      
      // 1. MANUALLY NUKE ALL SUPABASE COOKIES
      console.log('FORCIBLY CLEARING ALL AUTHENTICATION COOKIES');
      
      // Get all cookies
      const allCookies = document.cookie.split(';');
      console.log('Found cookies:', allCookies.length);
      
      // Clear absolutely every cookie related to auth
      allCookies.forEach(cookie => {
        const trimmedCookie = cookie.trim();
        const name = trimmedCookie.split('=')[0];
        
        // Target any cookie that might be related to auth
        if (
          name.startsWith('sb') || 
          name.includes('auth') || 
          name.includes('session') || 
          name.includes('supabase')
        ) {
          console.log('Nuking cookie:', name);
          
          // Clear with every possible path and domain combination
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname};`;
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict;`;
          
          // Try root domain
          const parts = window.location.hostname.split('.');
          if (parts.length > 1) {
            const rootDomain = parts.slice(-2).join('.');
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${rootDomain};`;
            document.cookie = `${name}=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict;`;
          }
        }
      });

      // 2. CLEAR LOCAL STORAGE
      console.log('Clearing all localStorage items related to auth');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb') || 
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('session')
        )) {
          console.log('Removing localStorage item:', key);
          localStorage.removeItem(key);
        }
      }

      // 3. CLEAR SESSION STORAGE
      console.log('Clearing all sessionStorage items related to auth');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith('sb') || 
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('session')
        )) {
          console.log('Removing sessionStorage item:', key);
          sessionStorage.removeItem(key);
        }
      }
      
      // 4. Try server-side signout as fallback
      try {
        console.log('Calling server-side signout API');
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
      } catch (serverError) {
        console.error('Server-side sign out error (non-critical):', serverError);
      }

      // 5. Force state reset in component
      setUser(null);
      
      // 6. HARD RELOAD THE ENTIRE PAGE TO RESET ALL APP STATE
      console.log('FORCING FULL PAGE RELOAD TO CLEAR ALL STATE');
      setTimeout(() => {
        window.location.href = '/?forcedSignOut=true&t=' + Date.now();
      }, 500);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Last resort - force reload anyway
      window.location.href = '/?forcedSignOut=true&t=' + Date.now();
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b flex justify-between items-center px-4 py-2">
      <div className="font-bold text-lg">Rightmove Tracker</div>
      {user && (
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Signing out..." : "Sign out"}
        </button>
      )}
    </header>
  );
} 