import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // If code is not present, redirect to sign-in page
  if (!code) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  console.log('Auth callback processing code from magic link');
  
  // Create a Supabase client configured to use cookies
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
  
  // Create a service role client for admin operations (bypasses RLS)
  // IMPORTANT: This should only be used server-side and never exposed to the client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  
  // Check if service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured. User creation may fail due to permissions.');
  }
  
  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(new URL('/sign-in?error=auth', request.url))
  }
  
  console.log('Successfully exchanged code for session');
  
  // Get the user from the session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('Error getting user after authentication:', userError);
    return NextResponse.redirect(new URL('/sign-in?error=user', request.url))
  }
  
  console.log('Retrieved user data:', user?.id, user?.email);
  
  // If we have a user, ensure they exist in the users table
  if (user) {
    try {
      console.log('Checking if user exists in database:', user.id);
      
      // Try with normal client first
      let { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (queryError) {
        console.log('Result of user existence check with standard client:', queryError.code, queryError.message);
        
        // If there's an error with standard client, try with admin client
        const adminCheckResult = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()
        
        existingUser = adminCheckResult.data
        queryError = adminCheckResult.error
        
        console.log('Result of user existence check with admin client:', 
          queryError ? `Error: ${queryError.code}` : `Success: ${existingUser ? 'Found' : 'Not found'}`);
      } else {
        console.log('User exists check result:', existingUser ? 'Found' : 'Not found');
      }
      
      // If the user doesn't exist in the users table, create them
      if ((queryError && queryError.code === 'PGRST116') || !existingUser) {
        console.log('Creating new user in the database:', user.email);
        
        const userData = { 
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        };
        
        console.log('User data to insert:', userData);
        
        // Try to insert with admin client first (bypasses RLS)
        let insertResult;
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.log('Attempting user creation with admin client');
          insertResult = await supabaseAdmin
            .from('users')
            .insert([userData])
            .select();
        } else {
          console.log('Attempting user creation with standard client');
          insertResult = await supabase
            .from('users')
            .insert([userData])
            .select();
        }
        
        const { error: insertError, data: insertData } = insertResult;
        
        if (insertError) {
          console.error('Error creating user in the database:', insertError);
          console.error('Full error details:', JSON.stringify(insertError));
          
          // If service role key isn't configured, provide specific error
          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('This may be due to missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
            console.error('Or due to Row Level Security (RLS) policies restricting inserts to the users table');
          }
        } else {
          console.log('Successfully created user in the database:', user.email);
          console.log('Insert response:', insertData);
        }
      } else {
        console.log('User already exists in database, skipping creation');
      }
    } catch (error) {
      console.error('Unexpected error in user creation process:', error);
    }
  } else {
    console.error('No user found after authentication');
  }
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
} 