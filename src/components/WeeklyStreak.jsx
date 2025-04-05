// src/components/WeeklyStreak.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function WeeklyStreak({ userId }) {
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user if userId is not provided
        let currentUserId = userId;
        if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setLoading(false);
            return;
          }
          currentUserId = user.id;
        }
        
        // Get last 7 days dates
        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        // Get logs for the last 7 days
        const { data: logData, error: logError } = await supabase
          .from('exercise_logs')
          .select('log_date, exercise_count')
          .eq('user_id', currentUserId)
          .in('log_date', dates);
          
        if (logError) throw logError;
        
        // Process data for each day
        const processedData = dates.map(date => {
          const dayLogs = logData?.filter(log => log.log_date === date) || [];
          const totalCount = dayLogs.reduce((sum, log) => sum + log.exercise_count, 0);
          
          return {
            date,
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            count: totalCount,
            hasActivity: totalCount > 0
          };
        });
        
        setWeekData(processedData);
        
        // Calculate current streak
        let streak = 0;
        // Start from today (last item) and go backwards
        for (let i = processedData.length - 1; i >= 0; i--) {
          if (processedData[i].hasActivity) {
            streak++;
          } else {
            break; // Break at first day with no activity
          }
        }
        setCurrentStreak(streak);
        
      } catch (err) {
        console.error('Error fetching weekly data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, [userId]);
  
  const renderStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start your streak today by logging your first exercise";
    } else if (currentStreak === 1) {
      return "You've logged today! Keep going tomorrow";
    } else if (currentStreak === 7) {
      return "🔥 Perfect week! You've exercised every day";
    } else {
      return `${currentStreak} day streak - Keep it going!`;
    }
  };
  
  if (loading) {
    return (
      <div className="streak-loading">
        <div className="loader"></div>
        <p>Loading your activity...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="streak-error">
        <p>Error loading activity data</p>
      </div>
    );
  }
  
  return (
    <div className="weekly-streak">
      <div className="streak-header">
        <div className="streak-title">
          <h3>Weekly Activity</h3>
          <p>{renderStreakMessage()}</p>
        </div>
        
        <div className="streak-badge">
          <div className="streak-count">{currentStreak}</div>
          <div className="streak-label">day streak</div>
        </div>
      </div>
      
      <div className="day-grid">
        {weekData.map((day) => (
          <div key={day.date} className="day-item">
            <div className={`day-circle ${day.hasActivity ? 'active' : ''}`}>
              {day.hasActivity && day.count}
            </div>
            <div className="day-label">{day.day}</div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .weekly-streak {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }
        
        .streak-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .streak-title h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.1rem;
        }
        
        .streak-title p {
          margin: 0;
          color: var(--color-text-light);
          font-size: 0.875rem;
        }
        
        .streak-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 70px;
          background-color: var(--color-background);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
        }
        
        .streak-count {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1;
          color: var(--color-primary);
        }
        
        .streak-label {
          font-size: 0.75rem;
          color: var(--color-text-light);
        }
        
        .day-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: var(--spacing-xs);
        }
        
        .day-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .day-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
          background-color: var(--color-background);
          color: var(--color-text-light);
          transition: all 0.2s ease;
        }
        
        .day-circle.active {
          background-color: var(--color-primary);
          color: white;
          transform: scale(1.05);
        }
        
        .day-label {
          font-size: 0.75rem;
          color: var(--color-text-light);
        }
        
        .streak-loading, .streak-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          min-height: 150px;
          color: var(--color-text-light);
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        
        .loader {
          border: 3px solid var(--color-border);
          border-radius: 50%;
          border-top: 3px solid var(--color-primary);
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .day-circle {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }
          
          .day-label {
            font-size: 0.7rem;
          }
          
          .streak-count {
            font-size: 1.5rem;
          }
          
          .streak-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .streak-badge {
            width: 100%;
            flex-direction: row;
            justify-content: center;
            gap: var(--spacing-sm);
          }
          
          .streak-badge .streak-label {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
}