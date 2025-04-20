// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth', 
  '/api/auth', 
  '/reset-password',
  '/reset-password-confirm'
];

// Add debugging to track flow
const debug = (message, data = null) => {
  console.log(`[Middleware] ${message}`, data || '');
};

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  debug(`Request to ${url.pathname}`, { isPublicRoute });
  
  // Check for auth cookies first
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');
  let sessionValid = false;
  
  // Try to validate the session if tokens exist
  if (accessToken && refreshToken) {
    try {
      debug('Validating session with tokens');
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value
      });
      
      // Session is valid if we have a user and no error
      sessionValid = !error && !!data?.user?.id;
      
      debug('Session validation result', { 
        valid: sessionValid, 
        hasUser: !!data?.user,
        hasError: !!error
      });
      
      // If session is invalid, clean up the cookies
      if (!sessionValid) {
        debug('Clearing invalid session cookies');
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
      }
    } catch (err) {
      // In case of any error, assume session is invalid and clean up
      debug('Session validation error', err);
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      sessionValid = false;
    }
  } else {
    debug('No auth tokens found');
  }
  
  // Handle public routes
  if (isPublicRoute) {
    // Only redirect from auth page if session is actually valid
    if (sessionValid && (url.pathname === '/auth' || url.pathname === '/reset-password')) {
      debug('Redirecting from auth to home (valid session)');
      return redirect('/');
    }
    
    // Otherwise, continue to the public route as normal
    debug('Continuing to public route');
    return await next();
  }
  
  // For protected routes, redirect to auth if session is invalid
  if (!sessionValid) {
    debug('Redirecting to auth (invalid session)');
    return redirect('/auth');
  }
  
  // Session is valid and route is protected - continue
  debug('Continuing to protected route (valid session)');
  return await next();
});