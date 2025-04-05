// src/components/WeeklyStreak.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function WeeklyStreak() {
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
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
          .eq('user_id', user.id)
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
  }, []);
  
  if (loading) return <div className="loading">Loading your streak data...</div>;
  
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="weekly-streak">
      <div className="streak-header">
        <h3>Your Weekly Activity</h3>
        <div className="current-streak">
          <span className="streak-count">{currentStreak}</span>
          <span className="streak-label">day{currentStreak !== 1 ? 's' : ''} streak</span>
        </div>
      </div>
      
      <div className="day-circles">
        {weekData.map((day, index) => (
          <div key={day.date} className="day-item">
            <div 
              className={`day-circle ${day.hasActivity ? 'active' : 'inactive'}`}
              title={`${day.count} exercises on ${new Date(day.date).toLocaleDateString()}`}
            >
              {day.hasActivity && day.count}
            </div>
            <div className="day-label">{day.day}</div>
          </div>
        ))}
      </div>
      
      <div className="streak-footer">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-circle inactive"></div>
            <span>No activity</span>
          </div>
          <div className="legend-item">
            <div className="legend-circle active"></div>
            <span>Active day</span>
          </div>
        </div>
        
        {currentStreak > 0 ? (
          <p className="streak-message">
            {currentStreak === 7 ? (
              <span>Perfect week! You've exercised every day! 🎉</span>
            ) : (
              <span>Keep going! Don't break your streak!</span>
            )}
          </p>
        ) : (
          <p className="streak-message">Log your first exercise today to start your streak!</p>
        )}
      </div>
      
      <style jsx>{`
        .weekly-streak {
          padding: 1rem;
        }
        
        .streak-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .streak-header h3 {
          margin: 0;
        }
        
        .current-streak {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .streak-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #4f46e5;
        }
        
        .streak-label {
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .day-circles {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .day-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .day-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .day-circle.active {
          background-color: #4f46e5;
          color: white;
        }
        
        .day-circle.inactive {
          background-color: #f3f4f6;
          color: #9ca3af;
        }
        
        .day-label {
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .streak-footer {
          margin-top: 1rem;
        }
        
        .legend {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .legend-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .legend-circle.active {
          background-color: #4f46e5;
        }
        
        .legend-circle.inactive {
          background-color: #f3f4f6;
        }
        
        .streak-message {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0;
        }
        
        .loading, .error {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
        }
        
        .error {
          color: #ef4444;
        }
        
        @media (max-width: 500px) {
          .day-circle {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
          }
          
          .day-label {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}