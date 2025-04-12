// tests/integration/challengeWorkflow.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChallengeList from '../../src/components/ChallengeList';
import { supabase } from '../../src/lib/supabase';

// Mock the Supabase client
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }
      })
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null })
    })
  }
}));

describe('Challenge Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock challenges data
    supabase.from().select().order.mockResolvedValueOnce({
      // tests/integration/challengeWorkflow.test.jsx (continued)
      data: [
        {
          id: 'challenge-1',
          title: 'Pushup Challenge',
          description: 'Do 50 pushups daily',
          exercise_type: 'pushups',
          goal_type: 'daily_count',
          goal_value: 50,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          creator: { username: 'admin', avatar_url: null }
        },
        {
          id: 'challenge-2',
          title: 'Situp Challenge',
          description: 'Do 100 situps daily',
          exercise_type: 'situps',
          goal_type: 'daily_count',
          goal_value: 100,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          creator: { username: 'admin', avatar_url: null }
        }
      ],
      error: null
    });
    
    // Mock user's joined challenges
    supabase.from().select().eq.mockResolvedValueOnce({
      data: [{ challenge_id: 'challenge-1' }],
      error: null
    });
  });

  test('user can view, join and leave challenges', async () => {
    render(<ChallengeList />);
    
    // Wait for challenges to load
    await waitFor(() => {
      expect(screen.getByText('Pushup Challenge')).toBeInTheDocument();
      expect(screen.getByText('Situp Challenge')).toBeInTheDocument();
    });
    
    // Challenge 1 should show "Leave Challenge" button (already joined)
    expect(screen.getByText('Leave Challenge')).toBeInTheDocument();
    
    // Challenge 2 should show "Join Challenge" button
    const joinButton = screen.getByText('Join Challenge');
    expect(joinButton).toBeInTheDocument();
    
    // Mock the join challenge API call
    supabase.from().insert.mockResolvedValueOnce({ error: null });
    
    // Join challenge 2
    fireEvent.click(joinButton);
    
    // Verify the API was called with correct params
    expect(supabase.from).toHaveBeenCalledWith('challenge_participants');
    expect(supabase.from().insert).toHaveBeenCalledWith([
      { challenge_id: 'challenge-2', user_id: 'test-user-id' }
    ]);
    
    // Mock challenges refresh after joining
    supabase.from().select().eq.mockResolvedValueOnce({
      data: [
        { challenge_id: 'challenge-1' },
        { challenge_id: 'challenge-2' }
      ],
      error: null
    });
    
    // Now leave the first challenge
    const leaveButton = screen.getByText('Leave Challenge');
    supabase.from().delete.mockResolvedValueOnce({ error: null });
    
    fireEvent.click(leaveButton);
    
    // Verify delete was called
    expect(supabase.from).toHaveBeenCalledWith('challenge_participants');
    expect(supabase.from().delete).toHaveBeenCalled();
  });
});