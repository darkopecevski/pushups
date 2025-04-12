// tests/components/ExerciseTracker.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ExerciseTracker from '../../src/components/ExerciseTracker';
import { supabase } from '../../src/lib/supabase';

// Create a more detailed mock for Supabase client
vi.mock('../../src/lib/supabase', () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: insertMock,
    update: updateMock,
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: { id: 'test-user-id' } }
        })
      },
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: 0 }),
    }
  };
});

describe('ExerciseTracker Component', () => {
  const mockChallenge = {
    id: 'challenge-id',
    title: 'Test Challenge',
    exercise_type: 'pushups',
    goal_type: 'daily_count',
    goal_value: 50,
    start_date: '2025-01-01',
    end_date: '2025-12-31'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful challenge fetch
    supabase.from.mockImplementation((table) => {
      if (table === 'challenges') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockChallenge,
            error: null
          })
        };
      }
      
      if (table === 'challenge_participants') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { challenge_id: 'challenge-id', user_id: 'test-user-id' },
            error: null
          })
        };
      }
      
      if (table === 'exercise_logs') {
        const insertMock = vi.fn().mockResolvedValue({ data: { id: 'new-log-id' }, error: null });
        const updateMock = vi.fn().mockResolvedValue({ error: null });
        
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          }),
          insert: insertMock,
          update: updateMock,
        };
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
    });
  });

  test('renders loading state initially', async () => {
    render(<ExerciseTracker challengeId="challenge-id" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('allows incrementing and decrementing exercise count', async () => {
    render(<ExerciseTracker challengeId="challenge-id" />);
    
    // Wait for loading to complete - look for exercise count text
    await waitFor(() => {
      expect(screen.getByText(/exercise count/i)).toBeInTheDocument();
    });
    
    // Get the count input
    const countInput = screen.getByRole('spinbutton');
    expect(countInput.value).toBe('0');
    
    // Increment
    const incrementButton = screen.getByLabelText(/increase count/i);
    fireEvent.click(incrementButton);
    expect(countInput.value).toBe('1');
    
    // Decrement
    const decrementButton = screen.getByLabelText(/decrease count/i);
    fireEvent.click(decrementButton);
    expect(countInput.value).toBe('0');
  });

  test('saves exercise log when save button is clicked', async () => {
    // Set up mocks for both insert and update cases
    const insertMock = vi.fn().mockResolvedValue({ data: { id: 'new-log-id' }, error: null });
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    
    // Mock the exercise log check first - important for the component flow
    const checkLogMock = vi.fn().mockResolvedValue({
      data: null, // No existing log found
      error: null
    });
    
    // Update supabase.from mock for exercise_logs with more detailed behavior
    supabase.from.mockImplementation((table) => {
      if (table === 'exercise_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: checkLogMock, // For checking existing log
          single: checkLogMock,      // Alternative API
          insert: insertMock,        // For new log
          update: updateMock         // For updating existing log
        };
      }
      
      if (table === 'challenges') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockChallenge,
            error: null
          })
        };
      }
      
      if (table === 'challenge_participants') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { challenge_id: 'challenge-id', user_id: 'test-user-id' },
            error: null
          })
        };
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
    });
    
    // Date mocking - ensure we have a consistent date for the test
    const realDate = global.Date;
    const mockDate = new Date('2025-04-06');
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new realDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
    global.Date.toISOString = realDate.toISOString;
    
    render(<ExerciseTracker challengeId="challenge-id" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/exercise count/i)).toBeInTheDocument();
    });
    
    // Set count to 10
    const countInput = screen.getByRole('spinbutton');
    fireEvent.change(countInput, { target: { value: '10' } });
    
    // Click save button
    const saveButton = screen.getByText(/save progress/i);
    fireEvent.click(saveButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Check that either insert or update was called
      expect(insertMock.mock.calls.length + updateMock.mock.calls.length).toBeGreaterThan(0);
    });
    
    // Reset the global Date object
    global.Date = realDate;
  });
});