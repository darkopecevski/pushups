// src/components/ExerciseTracker.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExerciseTracker({ challengeId }) {
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
        
        // If specific challengeId is provided
        if (challengeId) {
          // Get the specific challenge
          const { data: challenge, error: challengeError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', challengeId)
            .single();
            
          if (challengeError) throw challengeError;
          
          // Check if the user is a participant
          const { data: participant, error: participantError } = await supabase
            .from('challenge_participants')
            .select('*')
            .eq('challenge_id', challengeId)
            .eq('user_id', user.id)
            .single();
            
          if (participantError && participantError.code !== 'PGRST116') throw participantError;
          
          if (participant) {
            setUserChallenges([challenge]);
            
            // Get today's log for this challenge
            const { data: logData, error: logError } = await supabase
              .from('exercise_logs')
              .select('*')
              .eq('user_id', user.id)
              .eq('challenge_id', challengeId)
              .eq('log_date', today)
              .single();
              
            if (logError && logError.code !== 'PGRST116') throw logError;
            
            if (logData) {
              setTodayLogs({ [challengeId]: logData.exercise_count });
            }
          } else {
            // User is not a participant in this challenge
            setUserChallenges([]);
          }
        } else {
          // Get all challenges the user has joined
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
            ?.filter(p => p.challenges.start_date <= now && p.challenges.end_date >= now)
            .map(p => p.challenges) || [];
            
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
  }, [challengeId, today]);
  
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
  
  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Loading your challenges...</p>
    </div>
  );
  
  if (userChallenges.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <h3>No Active Challenges</h3>
        <p>You haven't joined any active challenges yet.</p>
        <a href="/challenges" className="btn btn-primary">Find Challenges</a>
      </div>
    );
  }
  
  return (
    <div className="exercise-tracker">
      <div className="date-display">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Today: <strong>{new Date().toLocaleDateString()}</strong></span>
      </div>
      
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="challenge-cards">
        {userChallenges.map(challenge => (
          <div key={challenge.id} className="challenge-card">
            <div className="card-header">
              <div className="challenge-type">{challenge.exercise_type}</div>
              <h3>{challenge.title}</h3>
            </div>
            
            <div className="card-body">
              <div className="log-form">
                <div className="log-label">Today's count:</div>
                <div className="counter">
                  <button 
                    onClick={() => handleCountChange(
                      challenge.id, 
                      Math.max(0, (todayLogs[challenge.id] || 0) - 1)
                    )}
                    className="counter-btn"
                    aria-label="Decrease count"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  
                  <input
                    type="number"
                    min="0"
                    value={todayLogs[challenge.id] || 0}
                    onChange={(e) => handleCountChange(challenge.id, e.target.value)}
                    className="counter-input"
                  />
                  
                  <button 
                    onClick={() => handleCountChange(
                      challenge.id, 
                      (todayLogs[challenge.id] || 0) + 1
                    )}
                    className="counter-btn"
                    aria-label="Increase count"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              {challenge.goal_type === 'daily_count' && (
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min(100, ((todayLogs[challenge.id] || 0) / challenge.goal_value) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    <span className="current">{todayLogs[challenge.id] || 0}</span>
                    <span className="separator">/</span>
                    <span className="goal">{challenge.goal_value}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="card-footer">
              <button 
                onClick={() => saveLog(challenge.id)}
                className="btn btn-primary btn-sm"
              >
                Save Progress
              </button>
              
              {saveSuccess[challenge.id] && (
                <div className="save-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Saved!</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .exercise-tracker {
          margin-top: var(--spacing-md);
        }
        
        .date-display {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          color: var(--color-text-light);
          font-size: 0.9rem;
        }
        
        .date-display strong {
          color: var(--color-text);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          color: var(--color-text-light);
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
        
        .empty-state {
          text-align: center;
          padding: var(--spacing-xl) 0;
        }
        
        .empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-background);
          color: var(--color-text-light);
          margin-bottom: var(--spacing-md);
        }
        
        .challenge-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .challenge-card {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        
        .card-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .challenge-type {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--color-text-light);
          margin-bottom: var(--spacing-xs);
          text-transform: capitalize;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .card-body {
          padding: var(--spacing-md);
        }
        
        .card-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .log-form {
          margin-bottom: var(--spacing-md);
        }
        
        .log-label {
          font-size: 0.875rem;
          color: var(--color-text-light);
          margin-bottom: var(--spacing-sm);
        }
        
        .counter {
          display: flex;
          align-items: center;
          max-width: 180px;
        }
        
        .counter-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--color-white);
          border: 1px solid var(--color-border);
          color: var(--color-text);
        }
        
        .counter-btn:first-child {
          border-radius: var(--radius-md) 0 0 var(--radius-md);
        }
        
        .counter-btn:last-child {
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        
        .counter-input {
          width: 60px;
          height: 40px;
          border: 1px solid var(--color-border);
          border-left: none;
          border-right: none;
          text-align: center;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .counter-input:focus {
          outline: none;
        }
        
        /* Remove spinner for number input */
        .counter-input::-webkit-outer-spin-button,
        .counter-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .counter-input[type=number] {
          -moz-appearance: textfield;
        }
        
        .goal-progress {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: var(--color-background);
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: var(--color-primary);
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          white-space: nowrap;
        }
        
        .current {
          font-weight: 600;
        }
        
        .separator {
          color: var(--color-text-light);
        }
        
        .goal {
          color: var(--color-text-light);
        }
        
        .save-success {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-success);
          font-size: 0.875rem;
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }
      `}</style>
    </div>
  );
}