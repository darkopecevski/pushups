// src/components/ExerciseTracker.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExerciseTracker() {
  const [loading, setLoading] = useState(true);
  const [userChallenges, setUserChallenges] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [todayLogs, setTodayLogs] = useState({});
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState({});
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch user's challenges and today's logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setCurrentUser(user);
        
        // Get challenges the user has joined
        const { data: participantData, error: participantError } = await supabase
          .from('challenge_participants')
          .select(`
            challenge_id,
            challenges:challenge_id (
              id, title, exercise_type, goal_type, goal_value, start_date, end_date
            )
          `)
          .eq('user_id', user.id);
          
        if (participantError) throw participantError;
        
        // Filter out challenges that haven't started yet or have ended
        const now = new Date().toISOString().split('T')[0];
        const activeChallenges = participantData
          .filter(p => p.challenges.start_date <= now && p.challenges.end_date >= now)
          .map(p => p.challenges);
          
        setUserChallenges(activeChallenges);
        
        // Get today's logs for active challenges
        if (activeChallenges.length > 0) {
          const challengeIds = activeChallenges.map(c => c.id);
          
          const { data: logData, error: logError } = await supabase
            .from('exercise_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('log_date', today)
            .in('challenge_id', challengeIds);
            
          if (logError) throw logError;
          
          // Convert logs array to object with challenge_id as key
          const logsObj = {};
          logData?.forEach(log => {
            logsObj[log.challenge_id] = log.exercise_count;
          });
          
          setTodayLogs(logsObj);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up a subscription to real-time changes in exercise_logs
    const logsSubscription = supabase
      .channel('public:exercise_logs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'exercise_logs'
        }, 
        payload => {
          if (payload.new.log_date === today) {
            setTodayLogs(prev => ({
              ...prev,
              [payload.new.challenge_id]: payload.new.exercise_count
            }));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(logsSubscription);
    };
  }, [today]);
  
  const handleCountChange = (challengeId, count) => {
    setTodayLogs(prev => ({
      ...prev,
      [challengeId]: parseInt(count) || 0
    }));
  };
  
  const saveLog = async (challengeId) => {
    try {
      setError(null);
      setSaveSuccess(prev => ({ ...prev, [challengeId]: false }));
      
      if (!currentUser) return;
      
      const count = todayLogs[challengeId] || 0;
      
      // Check if log already exists for today
      const { data: existingLog, error: checkError } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('challenge_id', challengeId)
        .eq('log_date', today)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      let error;
      
      if (existingLog) {
        // Update existing log
        const { error: updateError } = await supabase
          .from('exercise_logs')
          .update({ exercise_count: count })
          .eq('id', existingLog.id);
          
        error = updateError;
      } else {
        // Insert new log
        const { error: insertError } = await supabase
          .from('exercise_logs')
          .insert([
            {
              user_id: currentUser.id,
              challenge_id: challengeId,
              exercise_count: count,
              log_date: today
            }
          ]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      setSaveSuccess(prev => ({ ...prev, [challengeId]: true }));
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [challengeId]: false }));
      }, 3000);
      
    } catch (err) {
      console.error('Error saving log:', err);
      setError(err.message);
    }
  };
  
  if (loading) return <div className="loading">Loading your challenges...</div>;
  
  if (userChallenges.length === 0) {
    return (
      <div className="no-challenges">
        <h3>No Active Challenges</h3>
        <p>You haven't joined any active challenges yet. Visit the Challenges page to find and join a challenge.</p>
        <a href="/challenges" className="btn">Find Challenges</a>
      </div>
    );
  }
  
  return (
    <div className="exercise-tracker">
      <p className="date-display">Today: <strong>{new Date().toLocaleDateString()}</strong></p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="challenges-list">
        {userChallenges.map(challenge => (
          <div key={challenge.id} className="challenge-log-card">
            <div className="challenge-info">
              <h4>{challenge.title}</h4>
              <span className="exercise-type">{challenge.exercise_type}</span>
            </div>
            
            <div className="log-content">
              <div className="log-input">
                <label htmlFor={`count-${challenge.id}`}>
                  Today's count:
                </label>
                <div className="count-control">
                  <button 
                    onClick={() => handleCountChange(
                      challenge.id, 
                      Math.max(0, (todayLogs[challenge.id] || 0) - 1)
                    )}
                    className="count-btn"
                    aria-label="Decrease count"
                  >
                    -
                  </button>
                  <input
                    id={`count-${challenge.id}`}
                    type="number"
                    min="0"
                    value={todayLogs[challenge.id] || 0}
                    onChange={(e) => handleCountChange(challenge.id, e.target.value)}
                  />
                  <button 
                    onClick={() => handleCountChange(
                      challenge.id, 
                      (todayLogs[challenge.id] || 0) + 1
                    )}
                    className="count-btn"
                    aria-label="Increase count"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => saveLog(challenge.id)}
                className="save-btn"
              >
                Save
              </button>
            </div>
            
            {saveSuccess[challenge.id] && (
              <div className="save-success">Saved successfully!</div>
            )}
            
            {challenge.goal_type === 'daily_count' && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min(100, ((todayLogs[challenge.id] || 0) / challenge.goal_value) * 100)}%` 
                    }}
                  />
                </div>
                <div className="progress-text">
                  <span className="current">{todayLogs[challenge.id] || 0}</span>
                  <span className="separator">/</span>
                  <span className="goal">{challenge.goal_value}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .exercise-tracker {
          margin-top: 1rem;
        }
        
        .date-display {
          margin-bottom: 1rem;
          color: #4b5563;
        }
        
        .error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .save-success {
          background-color: #dcfce7;
          color: #166534;
          padding: 0.5rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .challenges-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .challenge-log-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e5e7eb;
        }
        
        .challenge-info {
          margin-bottom: 0.75rem;
        }
        
        .challenge-info h4 {
          margin: 0 0 0.25rem 0;
        }
        
        .exercise-type {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .log-content {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
        }
        
        .log-input {
          flex: 1;
        }
        
        .log-input label {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .count-control {
          display: flex;
          align-items: center;
        }
        
        .count-btn {
          background-color: #e5e7eb;
          border: none;
          width: 2rem;
          height: 2rem;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .count-btn:first-child {
          border-radius: 4px 0 0 4px;
        }
        
        .count-btn:last-child {
          border-radius: 0 4px 4px 0;
        }
        
        .count-control input {
          width: 4rem;
          height: 2rem;
          border: 1px solid #e5e7eb;
          text-align: center;
          font-size: 1rem;
        }
        
        .save-btn {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          height: 2rem;
        }
        
        .save-btn:hover {
          background-color: #4338ca;
        }
        
        .progress-section {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .progress-bar {
          flex: 1;
          height: 0.5rem;
          background-color: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #4f46e5;
          border-radius: 9999px;
        }
        
        .progress-text {
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .current {
          color: #4f46e5;
        }
        
        .separator {
          color: #9ca3af;
        }
        
        .goal {
          color: #6b7280;
        }
        
        .loading {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .no-challenges {
          padding: 2rem;
          text-align: center;
        }
        
        .btn {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          margin-top: 1rem;
        }
        
        @media (max-width: 640px) {
          .log-content {
            flex-direction: column;
            align-items: stretch;
          }
          
          .save-btn {
            margin-top: 0.5rem;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}