# Supabase Setup Instructions

To properly configure Supabase and fix the sign-out functionality, follow these steps:

## 1. Environment Variables Setup

### Correct Location for Environment Files in This Project

Since your Next.js application is located in the `rightmove-frontend/app` directory (not in the project root), the environment files should be placed in the **app directory**.

Ensure your `.env.local` file in the `app` directory contains your real Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

> **Important**: Next.js prioritizes `.env.local` over `.env`, so make sure your actual credentials are in `.env.local`, not just in `.env`.

You can find these values in your Supabase dashboard:
1. Go to your Supabase project dashboard
2. Click on the "Settings" icon in the left sidebar
3. Select "API" from the menu
4. Copy the "Project URL" and "anon/public" key

## 2. Correct Location for Supabase Packages

Since your Next.js application is in the `app` directory:

- Supabase packages should be installed in the `app` directory only
- They should be listed in `app/package.json`, not in the root `package.json`
- The `node_modules` folder in the `app` directory should contain all Supabase dependencies

Verify the installation with:

```bash
cd app
npm ls @supabase/ssr @supabase/supabase-js
```

If you find Supabase packages installed in both locations, you should uninstall them from the root and reinstall in the app directory:

```bash
# Remove from root
cd /path/to/rightmove-frontend
npm uninstall @supabase/ssr @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install in app directory
cd app
npm install
```

## 3. Restart Your Development Server

After updating the environment variables and ensuring packages are in the correct location, restart your Next.js development server:

```
cd app
npm run dev
```

## 4. Check Browser Console for Debugging

Open your browser developer tools (F12) and look for these log messages:
- "Supabase client initialized with SSR" - Confirms proper client initialization
- "Successfully fetched user data" - Confirms user data is being retrieved
- "Checking Supabase client:" - Should show "auth available"

## 5. Test Sign-out Flow

The sign-out process has been updated to be more robust. When clicking "Sign out":
1. The server-side sign-out API is called
2. Supabase client-side sign-out is attempted
3. Cookies are manually cleared
4. The user state is manually reset
5. Redirection to the home page occurs

## Troubleshooting

If sign-out still doesn't work:

1. **Check Environment File Location and Priority**:
   - Ensure your actual Supabase credentials are in `app/.env.local` (not just in `app/.env`)
   - Remove any environment files from the project root (`rightmove-frontend/.env*`)
   - Note that `.env.local` takes priority over `.env`, so if both exist, `.env.local` values will be used

2. **Check Package Installation Location**:
   - Make sure Supabase packages are only installed in the `app` directory
   - Remove any duplicate installations from the root directory
   - Run `npm list @supabase/supabase-js` in both directories to check

3. **Clear Browser Storage Manually**:
   - Open Developer Tools (F12)
   - Go to Application tab
   - Clear Storage (Cookies, Local Storage, Session Storage)

4. **Check Network Requests**:
   - Monitor the Network tab in Developer Tools
   - Look for any failed requests during sign-out

5. **Validate API Routes**:
   - Ensure `/api/auth/signout` endpoint is properly configured

6. **Supabase Version Compatibility**:
   - Verify that `@supabase/ssr` (v0.6.1) and `@supabase/supabase-js` (v2.49.8) are compatible

## Additional Notes

- The updated code includes multiple fallback mechanisms to ensure sign-out works even if the Supabase client has issues
- Additional error logging has been added to help diagnose any remaining problems
- The Supabase client initialization has been made more robust with proper error handling
