// src/components/ExerciseTracker.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ExerciseTracker() {
  const [loading, setLoading] = useState(true);
  const [userChallenges, setUserChallenges] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [todayLogs, setTodayLogs] = useState({});
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
          table: 'exercise_logs',
          filter: `user_id=eq.${currentUser?.id}` 
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
      setSaveSuccess(false);
      
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
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error saving log:', err);
      setError(err.message);
    }
  };
  
  if (loading) return <div>Loading your challenges...</div>;
  
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
      <h2>Today's Exercise Log</h2>
      <p className="date-display">Date: {new Date().toLocaleDateString()}</p>
      
      {error && <div className="error">{error}</div>}
      {saveSuccess && <div className="success">Exercise log saved successfully!</div>}
      
      <div className="challenges-list">
        {userChallenges.map(challenge => (
          <div key={challenge.id} className="challenge-log-card">
            <h3>{challenge.title}</h3>
            <p>Exercise: {challenge.exercise_type}</p>
            
            {challenge.goal_type === 'daily_count' && (
              <p className="goal-display">
                Daily Goal: {challenge.goal_value} {challenge.exercise_type}
              </p>
            )}
            
            <div className="log-input">
              <label htmlFor={`count-${challenge.id}`}>
                Today's {challenge.exercise_type} count:
              </label>
              <div className="count-control">
                <button 
                  onClick={() => handleCountChange(
                    challenge.id, 
                    Math.max(0, (todayLogs[challenge.id] || 0) - 1)
                  )}
                  className="count-btn"
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
            
            {challenge.goal_type === 'daily_count' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min(100, ((todayLogs[challenge.id] || 0) / challenge.goal_value) * 100)}%` 
                  }}
                />
                <span className="progress-text">
                  {todayLogs[challenge.id] || 0} / {challenge.goal_value}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}