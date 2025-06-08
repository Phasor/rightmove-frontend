'use client';

import { usePathname } from 'next/navigation';
import { useSupabase } from '../supabase-provider';

export function Header() {
  const { user, isLoading, signOut } = useSupabase();
  const pathname = usePathname();

  const isDashboard = pathname === '/dashboard' || pathname?.startsWith('/dashboard/');

  const handleSignOut = async () => {
    try {
      await signOut();
      // As a fallback, force navigation to the home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b flex justify-between items-center px-4 py-2">
      <div className="font-bold text-lg">Rightmove Tracker</div>
      {user && isDashboard && (
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </button>
      )}
    </header>
  );
}
