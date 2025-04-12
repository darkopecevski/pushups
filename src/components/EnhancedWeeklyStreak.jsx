// src/components/EnhancedWeeklyStreak.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EnhancedWeeklyStreak({ userId }) {
  const [loading, setLoading] = useState(true);
  const [challengeData, setChallengeData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState('all');
  
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
        
        // Get dates for the last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        // Get challenges the user has joined
        const { data: participantData, error: participantError } = await supabase
          .from('challenge_participants')
          .select(`
            challenge_id,
            challenges:challenge_id (
              id, title, exercise_type, goal_type, goal_value
            )
          `)
          .eq('user_id', currentUserId);
          
        if (participantError) throw participantError;
        
        const userChallenges = participantData?.map(p => p.challenges) || [];
        
        // Get logs for the last 7 days for all challenges
        const { data: logData, error: logError } = await supabase
          .from('exercise_logs')
          .select('log_date, exercise_count, challenge_id')
          .eq('user_id', currentUserId)
          .in('log_date', dates);
          
        if (logError) throw logError;
        
        // Group logs by challenge
        const challengeLogs = {};
        
        // Initialize with all challenges
        userChallenges.forEach(challenge => {
          challengeLogs[challenge.id] = {
            id: challenge.id,
            title: challenge.title,
            exerciseType: challenge.exercise_type,
            goalValue: challenge.goal_value,
            goalType: challenge.goal_type,
            streak: 0,
            totalCount: 0,
            dailyData: {}
          };
          
          // Initialize daily data
          dates.forEach(date => {
            challengeLogs[challenge.id].dailyData[date] = {
              date,
              count: 0,
              hasActivity: false,
              day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
            };
          });
        });
        
        // Process logs data
        logData?.forEach(log => {
          const { challenge_id, log_date, exercise_count } = log;
          
          if (challengeLogs[challenge_id]) {
            // Update challenge daily data
            if (challengeLogs[challenge_id].dailyData[log_date]) {
              challengeLogs[challenge_id].dailyData[log_date].count = exercise_count;
              challengeLogs[challenge_id].dailyData[log_date].hasActivity = exercise_count > 0;
              challengeLogs[challenge_id].totalCount += exercise_count;
            }
          }
        });
        
        // Calculate streak for each challenge
        Object.keys(challengeLogs).forEach(challengeId => {
          const challenge = challengeLogs[challengeId];
          let currentStreak = 0;
          
          // Start from today (last date) and go backwards
          for (let i = dates.length - 1; i >= 0; i--) {
            const date = dates[i];
            if (challenge.dailyData[date]?.hasActivity) {
              currentStreak++;
            } else {
              break; // Break at first day with no activity
            }
          }
          
          challenge.streak = currentStreak;
        });
        
        // Create consolidated weekly data for "All Challenges" view
        const allChallengesData = {};
        dates.forEach(date => {
          allChallengesData[date] = {
            date,
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            count: 0,
            hasActivity: false
          };
        });
        
        // Fill in the consolidated data
        logData?.forEach(log => {
          const { log_date, exercise_count } = log;
          if (allChallengesData[log_date]) {
            allChallengesData[log_date].count += exercise_count;
            if (exercise_count > 0) {
              allChallengesData[log_date].hasActivity = true;
            }
          }
        });
        
        // Calculate overall streak
        let overallStreak = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
          const date = dates[i];
          if (allChallengesData[date]?.hasActivity) {
            overallStreak++;
          } else {
            break;
          }
        }
        
        // Add "All Challenges" option
        const allChallengesOption = {
          id: 'all',
          title: 'All Challenges',
          exerciseType: 'combined',
          streak: overallStreak,
          totalCount: Object.values(allChallengesData).reduce((sum, day) => sum + day.count, 0),
          dailyData: allChallengesData
        };
        
        // Convert challenge logs to array and add "All Challenges" option
        const challengesArray = Object.values(challengeLogs);
        challengesArray.unshift(allChallengesOption);
        
        setChallengeData(challengesArray);
        
        // Set week data based on selected challenge (default to 'all')
        const initialData = challengesArray.find(c => c.id === 'all') || challengesArray[0];
        setWeekData(Object.values(initialData.dailyData));
        
      } catch (err) {
        console.error('Error fetching weekly data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, [userId]);
  
  const handleChallengeChange = (challengeId) => {
    setSelectedChallenge(challengeId);
    
    const selected = challengeData.find(c => c.id === challengeId);
    if (selected) {
      setWeekData(Object.values(selected.dailyData));
    }
  };
  
  const getSelectedChallenge = () => {
    return challengeData.find(c => c.id === selectedChallenge) || {};
  };
  
  const renderStreakMessage = (streak) => {
    if (streak === 0) {
      return "Start your streak today by logging your first exercise";
    } else if (streak === 1) {
      return "You've logged today! Keep going tomorrow";
    } else if (streak === 7) {
      return "🔥 Perfect week! You've exercised every day";
    } else {
      return `${streak} day streak - Keep it going!`;
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
        <p>Error loading activity data: {error}</p>
      </div>
    );
  }
  
  const selected = getSelectedChallenge();
  
  return (
    <div className="enhanced-weekly-streak">
      <div className="streak-header">
        <div className="streak-title">
          <h3>Weekly Activity</h3>
          <p>{renderStreakMessage(selected.streak || 0)}</p>
        </div>
        
        <div className="streak-badge">
          <div className="streak-count">{selected.streak || 0}</div>
          <div className="streak-label">day streak</div>
        </div>
      </div>
      
      <div className="challenge-selector">
        <label htmlFor="challenge-select">Select challenge:</label>
        <div className="challenge-tabs">
          {challengeData.map(challenge => (
            <button
              key={challenge.id}
              className={`challenge-tab ${selectedChallenge === challenge.id ? 'active' : ''}`}
              onClick={() => handleChallengeChange(challenge.id)}
            >
              {challenge.id === 'all' ? 'All' : challenge.title.substring(0, 15)}
              {challenge.id !== 'all' && challenge.title.length > 15 ? '...' : ''}
            </button>
          ))}
        </div>
      </div>
      
      <div className="challenge-info">
        {selected.id !== 'all' && (
          <div className="challenge-details">
            <div className="challenge-type">{selected.exerciseType}</div>
            {selected.goalType === 'daily_count' && (
              <div className="challenge-goal">
                Daily Goal: {selected.goalValue} {selected.exerciseType}
              </div>
            )}
          </div>
        )}
        <div className="challenge-total">
          Total this week: <span className="total-count">{selected.totalCount || 0}</span>
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
      
      <style>{`
        .enhanced-weekly-streak {
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
        
        .challenge-selector {
          margin: var(--spacing-md) 0;
        }
        
        .challenge-selector label {
          display: block;
          font-size: 0.875rem;
          color: var(--color-text-light);
          margin-bottom: var(--spacing-xs);
        }
        
        .challenge-tabs {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
          overflow-x: auto;
          padding-bottom: var(--spacing-xs);
        }
        
        .challenge-tab {
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: 0.85rem;
          color: var(--color-text);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        
        .challenge-tab:hover {
          background-color: var(--color-background);
        }
        
        .challenge-tab.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        
        .challenge-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-md);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        
        .challenge-type {
          display: inline-block;
          padding: 0.1rem 0.5rem;
          background-color: rgba(255, 90, 95, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: var(--spacing-xs);
          text-transform: capitalize;
        }
        
        .challenge-goal {
          font-weight: 500;
        }
        
        .challenge-total {
          color: var(--color-text-light);
        }
        
        .total-count {
          font-weight: 700;
          color: var(--color-primary);
          font-size: 1.1rem;
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
        
        @media (max-width: 600px) {
          .day-circle {
            width: 30px;
            height: 30px;
            font-size: 0.7rem;
          }
          
          .day-label {
            font-size: 0.7rem;
          }
          
          .streak-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .streak-badge {
            align-self: flex-start;
          }
          
          .challenge-info {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
}