// Run this in your browser console to clear all Supabase auth cookies
(function clearAllSupabaseCookies() {
  console.log('Clearing all Supabase cookies...');
  
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Track cleared cookies
  const clearedCookies = [];
  
  // Try to clear any cookie that might be related to Supabase
  cookies.forEach(cookie => {
    const trimmedCookie = cookie.trim();
    const name = trimmedCookie.split('=')[0];
    
    // Clear any cookie with 'sb' or 'supabase' in the name
    if (name.includes('sb') || name.includes('supabase')) {
      console.log(`Clearing cookie: ${name}`);
      
      // Try multiple approaches to clear the cookie
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${location.hostname};`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${location.hostname}; secure;`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.${location.hostname};`;
      
      clearedCookies.push(name);
    }
  });
  
  if (clearedCookies.length > 0) {
    console.log(`Cleared cookies: ${clearedCookies.join(', ')}`);
    console.log('Reload the page to complete the sign-out');
  } else {
    console.log('No Supabase cookies found');
  }
  
  return clearedCookies;
})(); 