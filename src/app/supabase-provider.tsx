'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Create a context to share auth state
const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize the auth state when the component mounts
  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        console.log('Initial session fetched', !!session);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getInitialSession();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Refresh server-side props when auth state changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Custom sign out function that handles middleware properly
  const signOut = async () => {
    setIsLoading(true);
    
    try {
      // This will trigger the middleware cookie handling
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Successfully signed out');
      
      // Force a full page refresh by using window.location instead of router
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to use the Supabase context
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 