// tests/utils/supabase.test.js
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  getUserProfile 
} from '../../src/lib/supabase';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn()
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    })
  }))
}));

// Import the mocked Supabase client
import { supabase } from '../../src/lib/supabase';

describe('Supabase Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('signUp calls supabase.auth.signUp with correct params', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: 'success', error: null });
    
    await signUp('test@example.com', 'password123');
    
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('signIn calls supabase.auth.signInWithPassword with correct params', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: 'success', error: null });
    
    await signIn('test@example.com', 'password123');
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('getUserProfile fetches profile with correct user ID', async () => {
    supabase.from().single.mockResolvedValueOnce({ 
      data: { id: 'user-id', username: 'testuser' }, 
      error: null 
    });
    
    const result = await getUserProfile('user-id');
    
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from().select).toHaveBeenCalledWith('*');
    expect(supabase.from().select().eq).toHaveBeenCalledWith('id', 'user-id');
    expect(supabase.from().select().eq().single).toHaveBeenCalled();
    expect(result.data).toEqual({ id: 'user-id', username: 'testuser' });
  });
});