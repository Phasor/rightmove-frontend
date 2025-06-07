import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Signed out successfully' },
    { status: 200 }
  );
  
  // Clear all possible Supabase cookie names
  const possibleCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'sb-nxxayxikbctkgy',
    'sb-nxxayxikbctkqy',
    // Add any other cookie names here
  ];
  
  // Set all possible Supabase cookies to expire
  possibleCookieNames.forEach((name) => {
    // Standard path
    response.cookies.set({
      name,
      value: '',
      maxAge: 0,
      path: '/',
    });
    
    // Also try with secure and httpOnly flags
    response.cookies.set({
      name,
      value: '',
      maxAge: 0,
      path: '/',
      secure: true,
      httpOnly: true,
    });
  });
  
  // Add a header to indicate sign-out to the middleware
  response.headers.set('x-signout', 'true');
  
  return response;
} 