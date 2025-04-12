// tests/components/WeeklyStreak.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import WeeklyStreak from '../../src/components/WeeklyStreak';
import { supabase } from '../../src/lib/supabase';

// Mock the Supabase client
vi.mock('../../src/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: { id: 'test-user-id' } }
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      })
    }
  };
});

describe.skip('WeeklyStreak Component', () => {
  // Mock the date for consistent testing
  const mockDate = new Date('2025-04-12'); // Sunday
  const originalDate = global.Date;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Date to return a fixed date
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
    
    // Keep toISOString and other static methods
    global.Date.toISOString = originalDate.toISOString;
    global.Date.parse = originalDate.parse;
  });
  
  afterEach(() => {
    // Restore the original Date
    global.Date = originalDate;
  });
  
  test('renders loading state initially', () => {
    render(<WeeklyStreak userId="test-user-id" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  test('displays a 0-day streak when no activity', async () => {
    // Mock empty exercise logs
    supabase.from().select().in.mockResolvedValueOnce({
      data: [],
      error: null
    });
    
    render(<WeeklyStreak userId="test-user-id" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check for 0-day streak
    const streakCount = screen.getByText('0');
    expect(streakCount).toBeInTheDocument();
    
    // Check for the "Start your streak" message
    expect(screen.getByText(/Start your streak today/i)).toBeInTheDocument();
    
    // Verify Supabase was called properly
    expect(supabase.from).toHaveBeenCalledWith('exercise_logs');
  });
  
  test('calculates streak correctly with continuous activity', async () => {
    // Mock exercise logs for the last 3 days
    const today = new Date('2025-04-12'); // Sunday
    const yesterday = new Date('2025-04-11'); // Saturday
    const twoDaysAgo = new Date('2025-04-10'); // Friday
    
    // Create mock logs data with proper dates
    const mockLogs = [
      { log_date: today.toISOString().split('T')[0], exercise_count: 55 },
      { log_date: yesterday.toISOString().split('T')[0], exercise_count: 55 },
      { log_date: twoDaysAgo.toISOString().split('T')[0], exercise_count: 55 }
    ];

    console.log('Mock Logs:', mockLogs);
    
    supabase.from().select().in.mockResolvedValueOnce({
      data: mockLogs,
      error: null
    });
    
    render(<WeeklyStreak userId="test-user-id" />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check that we have active circles for the last 3 days
    // This is a more reliable test than looking for specific text
    const activeCircles = document.querySelectorAll('.day-circle.active');
    expect(activeCircles.length).toBe(3);
    
    // Check for the streak badge or container that shows the number
    const streakCountElements = document.querySelectorAll('.streak-count, .streak-badge, .streak-number');
    let foundStreakCount = false;
    
    streakCountElements.forEach(element => {
      if (element.textContent.includes('3')) {
        foundStreakCount = true;
      }
    });
    
    expect(foundStreakCount).toBe(true);
  });
  
  test('handles interrupted streak correctly', async () => {
    // Mock logs with gap in the middle
    const today = new Date('2025-04-06'); // Sunday
    const yesterday = new Date('2025-04-05'); // Saturday
    // Skip Friday (gap day)
    const threeDaysAgo = new Date('2025-04-03'); // Thursday
    
    // Create mock logs data with a gap
    const mockLogs = [
      { log_date: today.toISOString().split('T')[0], exercise_count: 10 },
      { log_date: yesterday.toISOString().split('T')[0], exercise_count: 15 },
      { log_date: threeDaysAgo.toISOString().split('T')[0], exercise_count: 20 }
    ];
    
    supabase.from().select().in.mockResolvedValueOnce({
      data: mockLogs,
      error: null
    });
    
    render(<WeeklyStreak userId="test-user-id" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Should show a 2-day streak (only today and yesterday count)
    const streakCount = screen.getByText('2');
    expect(streakCount).toBeInTheDocument();
    
    // Check for the "2 day streak" message
    expect(screen.getByText(/2 day streak/i)).toBeInTheDocument();
  });
  
  test('handles error state', async () => {
    // Mock error response
    supabase.from().select().in.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    });
    
    render(<WeeklyStreak userId="test-user-id" />);
    
    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText(/loading your activity/i)).not.toBeInTheDocument();
    });
    
    // Look for the specific error message text that your component uses
    expect(screen.getByText(/Error loading activity data/i)).toBeInTheDocument();
  });
  
  test('fetches user ID if not provided', async () => {
    // Mock empty logs response
    supabase.from().select().in.mockResolvedValueOnce({
      data: [],
      error: null
    });
    
    // Render without userId prop
    render(<WeeklyStreak />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Verify auth.getUser was called
    expect(supabase.auth.getUser).toHaveBeenCalled();
  });
});