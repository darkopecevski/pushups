// tests/mocks/handlers.js
import { http, HttpResponse } from 'msw'

// Get your Supabase URL from environment or hardcode it for tests
const supabaseUrl = 'https://your-project-id.supabase.co';

export const handlers = [
  // Auth endpoints
  http.post(`${supabaseUrl}/auth/v1/token`, ({ request }) => {
    const body = request.json(); // This is a promise
    
    // Since we're in a test environment, we can return a mocked response
    return HttpResponse.json({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    })
  }),
  
  // Profiles endpoint
  http.get(`${supabaseUrl}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (userId === 'test-user-id') {
      return HttpResponse.json([{
        id: 'test-user-id',
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: null,
        is_admin: false
      }])
    }
    
    return new HttpResponse(null, { status: 404 });
  }),
  
  // Challenges endpoint
  http.get(`${supabaseUrl}/rest/v1/challenges`, () => {
    return HttpResponse.json([
      {
        id: 'challenge-1',
        title: 'Pushup Challenge',
        exercise_type: 'pushups',
        goal_type: 'daily_count',
        goal_value: 50,
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      }
    ])
  }),
  
  // Exercise logs endpoint
  http.post(`${supabaseUrl}/rest/v1/exercise_logs`, () => {
    return HttpResponse.json({ id: 'new-log-id' }, { status: 201 })
  })
];