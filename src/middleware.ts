// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

// Define public routes that don't require authentication
const publicRoutes = ['/auth', '/api/auth'];

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // Skip authentication check for public routes
  if (isPublicRoute) {
    const { data } = await supabase.auth.getSession();
    
    // If user is already logged in and trying to access auth page, redirect to home
    if (data?.session && url.pathname === '/auth') {
      return redirect('/');
    }
    
    return await next();
  }
  
  // Check for auth cookies
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');
  
  if (!accessToken || !refreshToken) {
    return redirect('/auth');
  }
  
  // Set the session and validate tokens
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value
  });
  
  if (error || !data.user) {
    // Clear cookies if session is invalid
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    return redirect('/auth');
  }
  
  // Continue to the route
  return await next();
});