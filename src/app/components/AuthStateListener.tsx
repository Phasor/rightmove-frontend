"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function AuthStateListener() {
  useEffect(() => {
    let subscription = { unsubscribe: () => {} };
    
    try {
      // Set up auth state listener with error handling
      const authStateResult = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only run for sign-in and user update events
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          const user = session.user;
          
          // Check if user exists in the users table
          const { data: existingUser, error: queryError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
            
          // If user doesn't exist or there was an error finding them, create them
          if ((queryError && queryError.code === 'PGRST116') || !existingUser) {
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  created_at: new Date().toISOString()
                }
              ]);
              
            if (insertError) {
              console.error('Error creating user:', insertError);
            } else {
              console.log('Created new user in database');
            }
          }
        }
      }
    });
    
      // Store subscription reference
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
      } catch (e) {
        console.error('Error unsubscribing from auth state changes:', e);
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 