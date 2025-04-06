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

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // Check for auth cookies first
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');
  let sessionValid = false;
  
  // Try to validate the session if tokens exist
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value
      });
      
      // Session is valid if we have a user and no error
      sessionValid = !error && data?.user;
      
      // If session is invalid, clean up the cookies
      if (!sessionValid) {
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
      }
    } catch (err) {
      // In case of any error, assume session is invalid and clean up
      console.error('Session validation error:', err);
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      sessionValid = false;
    }
  }
  
  // Handle public routes
  if (isPublicRoute) {
    // Only redirect from auth page if session is actually valid
    if (sessionValid && (url.pathname === '/auth' || url.pathname === '/reset-password')) {
      return redirect('/');
    }
    
    // Otherwise, continue to the public route as normal
    return await next();
  }
  
  // For protected routes, redirect to auth if session is invalid
  if (!sessionValid) {
    return redirect('/auth');
  }
  
  // Session is valid and route is protected - continue
  return await next();
});