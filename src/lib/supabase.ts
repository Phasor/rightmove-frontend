import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Try to create the client using SSR method first (recommended for Next.js)
let supabase: SupabaseClient;

try {
  console.log('Initializing Supabase browser client');
  supabase = createBrowserClient(
    supabaseUrl!, 
    supabaseAnonKey!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      }
    }
  );
  console.log('Supabase client initialized with SSR browser client');
} catch (error) {
  // Fallback to standard client if SSR client fails
  console.warn('Failed to initialize Supabase SSR client, falling back to standard client:', error);
  try {
    supabase = createClient(
      supabaseUrl!, 
      supabaseAnonKey!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        }
      }
    );
    console.log('Supabase client initialized with standard client');
  } catch (fallbackError) {
    console.error('Failed to initialize Supabase client:', fallbackError);
    // Create a mock client that logs errors but doesn't crash the app
    supabase = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Supabase client not initialized') }),
        signOut: async () => ({ error: new Error('Supabase client not initialized') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
    } as unknown as SupabaseClient;
  }
}

export { supabase }; 