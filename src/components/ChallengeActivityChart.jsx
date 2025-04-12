// src/components/ChallengeActivityChart.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChallengeActivityChart({ challengeId, userId }) {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);
  const [challengeDetails, setChallengeDetails] = useState(null);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('week'); // 'week', 'month', 'all'
  
  useEffect(() => {
    const fetchActivityData = async () => {
      if (!challengeId) return;
      
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
        
        // Get challenge details
        const { data: challenge, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .single();
          
        if (challengeError) throw challengeError;
        setChallengeDetails(challenge);
        
        // Calculate date range based on timeframe
        const today = new Date();
        let startDate;
        
        if (timeFrame === 'week') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6); // Last 7 days
        } else if (timeFrame === 'month') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 29); // Last 30 days
        } else {
          // All-time: use challenge start date
          startDate = new Date(challenge.start_date);
          
          // If challenge hasn't started yet, use today
          if (startDate > today) {
            startDate = today;
          }
        }
        
        // Format dates for database query
        const startDateStr = startDate.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        
        // Get exercise logs for the date range
        const { data: logData, error: logError } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('challenge_id', challengeId)
          .gte('log_date', startDateStr)
          .lte('log_date', todayStr)
          .order('log_date');
          
        if (logError) throw logError;
        
        // Generate all dates in the range (for days with no activity)
        const allDates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= today) {
          allDates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Create a map of all logs by date
        const logsByDate = {};
        logData?.forEach(log => {
          logsByDate[log.log_date] = log.exercise_count;
        });
        
        // Build the complete activity data with all dates
        const completeActivityData = allDates.map(date => {
          return {
            date,
            formattedDate: new Date(date).toLocaleDateString(undefined, {
              month: 'short', 
              day: 'numeric'
            }),
            count: logsByDate[date] || 0,
            hasActivity: (logsByDate[date] || 0) > 0,
            dayOfWeek: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            isToday: date === todayStr
          };
        });
        
        setActivityData(completeActivityData);
        
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityData();
  }, [challengeId, userId, timeFrame]);
  
  const calculateStreak = () => {
    if (!activityData.length) return 0;
    
    let streak = 0;
    // Start from the most recent day (end of array) and go backwards
    for (let i = activityData.length - 1; i >= 0; i--) {
      if (activityData[i].hasActivity) {
        streak++;
      } else {
        break; // Break at first day with no activity
      }
    }
    
    return streak;
  };
  
  const calculateGoalAchievement = () => {
    if (!challengeDetails || !activityData.length) return 0;
    
    // For daily_count goal type
    if (challengeDetails.goal_type === 'daily_count') {
      const daysMetGoal = activityData.filter(day => 
        day.count >= challengeDetails.goal_value
      ).length;
      
      return Math.round((daysMetGoal / activityData.length) * 100);
    }
    
    // For total_count goal type
    if (challengeDetails.goal_type === 'total_count') {
      const totalExercises = activityData.reduce((sum, day) => sum + day.count, 0);
      return Math.min(100, Math.round((totalExercises / challengeDetails.goal_value) * 100));
    }
    
    // Default fallback
    return 0;
  };
  
  const calculateTotalExercises = () => {
    return activityData.reduce((sum, day) => sum + day.count, 0);
  };
  
  const calculateAverageDailyExercises = () => {
    if (!activityData.length) return 0;
    const daysWithActivity = activityData.filter(day => day.hasActivity).length;
    if (daysWithActivity === 0) return 0;
    
    const totalExercises = calculateTotalExercises();
    return Math.round(totalExercises / daysWithActivity);
  };
  
  if (loading) {
    return (
      <div className="activity-loading">
        <div className="loader"></div>
        <p>Loading activity data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="activity-error">
        <p>Error loading activity data: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="challenge-activity-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>Activity for {challengeDetails?.title}</h3>
          <div className="exercise-type">{challengeDetails?.exercise_type}</div>
        </div>
        
        <div className="timeframe-selector">
          <button
            className={`timeframe-btn ${timeFrame === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFrame('week')}
          >
            Week
          </button>
          <button
            className={`timeframe-btn ${timeFrame === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFrame('month')}
          >
            Month
          </button>
          <button
            className={`timeframe-btn ${timeFrame === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFrame('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-title">Current Streak</div>
          <div className="stat-value">{calculateStreak()}</div>
          <div className="stat-label">days</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Goal Achievement</div>
          <div className="stat-value">{calculateGoalAchievement()}%</div>
          <div className="stat-label">completed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Total</div>
          <div className="stat-value">{calculateTotalExercises()}</div>
          <div className="stat-label">{challengeDetails?.exercise_type}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Daily Average</div>
          <div className="stat-value">{calculateAverageDailyExercises()}</div>
          <div className="stat-label">per active day</div>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-labels">
          <div className="y-axis-title">Exercise Count</div>
        </div>
        
        <div className="chart-content">
          {activityData.map((day, index) => {
            // Calculate bar height as percentage of max value
            const maxCount = Math.max(...activityData.map(d => d.count), challengeDetails?.goal_value || 1);
            const barHeight = day.count ? Math.max(5, (day.count / maxCount) * 100) : 0;
            
            // Check if daily goal was met (for daily_count goal type)
            const goalMet = challengeDetails?.goal_type === 'daily_count' && 
                            day.count >= challengeDetails.goal_value;
                          
            return (
              <div key={day.date} className="chart-column">
                <div className="bar-container">
                  {challengeDetails?.goal_type === 'daily_count' && (
                    <div className="goal-line" style={{
                      bottom: `${(challengeDetails.goal_value / maxCount) * 100}%`
                    }}></div>
                  )}
                  
                  <div 
                    className={`chart-bar ${goalMet ? 'goal-met' : ''} ${day.isToday ? 'today' : ''}`}
                    style={{ height: `${barHeight}%` }}
                  >
                    {day.count > 0 && (
                      <div className="bar-tooltip">{day.count}</div>
                    )}
                  </div>
                </div>
                
                <div className={`day-label ${day.isToday ? 'today' : ''}`}>
                  {timeFrame === 'week' ? day.dayOfWeek : day.formattedDate}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="activity-legend">
        <div className="legend-item">
          <div className="legend-color bar-color"></div>
          <div className="legend-label">Activity</div>
        </div>
        
        {challengeDetails?.goal_type === 'daily_count' && (
          <div className="legend-item">
            <div className="legend-color goal-color"></div>
            <div className="legend-label">Daily Goal ({challengeDetails.goal_value})</div>
          </div>
        )}
        
        <div className="legend-item">
          <div className="legend-color goal-met-color"></div>
          <div className="legend-label">Goal Met</div>
        </div>
      </div>
      
      <style>{`
        .challenge-activity-chart {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }
        
        .chart-title h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.1rem;
        }
        
        .exercise-type {
          display: inline-block;
          padding: 0.1rem 0.5rem;
          background-color: rgba(255, 90, 95, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .timeframe-selector {
          display: flex;
          gap: var(--spacing-xs);
        }
        
        .timeframe-btn {
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.75rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .timeframe-btn:hover {
          background-color: var(--color-background);
        }
        
        .timeframe-btn.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        
        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .stat-card {
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          text-align: center;
          transition: transform 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .stat-title {
          font-size: 0.75rem;
          color: var(--color-text-light);
          margin-bottom: var(--spacing-xs);
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1.2;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-light);
        }
        
        .chart-container {
          height: 200px;
          margin-bottom: var(--spacing-md);
          display: flex;
        }
        
        .chart-labels {
          width: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .y-axis-title {
          writing-mode: vertical-lr;
          transform: rotate(180deg);
          text-align: center;
          font-size: 0.7rem;
          color: var(--color-text-light);
        }
        
        .chart-content {
          flex: 1;
          display: flex;
          align-items: flex-end;
          height: 100%;
          gap: 2px;
        }
        
        .chart-column {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .bar-container {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }
        
        .chart-bar {
          width: 80%;
          max-width: 30px;
          background-color: var(--color-secondary);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          position: relative;
          transition: height 0.3s ease;
        }
        
        .chart-bar.goal-met {
          background-color: #4CAF50; /* Green for goal met */
        }
        
        .chart-bar.today {
          border: 2px solid var(--color-primary);
        }
        
        .bar-tooltip {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--color-text);
          color: white;
          padding: 2px 4px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        
        .chart-bar:hover .bar-tooltip {
          opacity: 1;
        }
        
        .goal-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: rgba(255, 90, 95, 0.7);
          z-index: 1;
        }
        
        .day-label {
          font-size: 0.7rem;
          color: var(--color-text-light);
          margin-top: var(--spacing-xs);
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .day-label.today {
          font-weight: 700;
          color: var(--color-primary);
        }
        
        .activity-legend {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
          margin-top: var(--spacing-md);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.75rem;
          color: var(--color-text-light);
        }
        
        .legend-color {
          width: 16px;
          height: 8px;
          border-radius: 4px;
        }
        
        .bar-color {
          background-color: var(--color-secondary);
        }
        
        .goal-color {
          background-color: rgba(255, 90, 95, 0.7);
        }
        
        .goal-met-color {
          background-color: #4CAF50;
        }
        
        .activity-loading, .activity-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          min-height: 200px;
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
        
        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .timeframe-selector {
            justify-content: space-between;
          }
          
          .stats-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 480px) {
          .stats-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}