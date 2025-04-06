// src/components/DailyCompletions.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DailyCompletions() {
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState([]);
  const [error, setError] = useState(null);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    const fetchDailyCompletions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, get active challenges with their goal values
        const { data: activeChallengesToday, error: challengesError } = await supabase
          .from('challenges')
          .select('id, title, exercise_type, goal_type, goal_value')
          .lte('start_date', today) // Challenge has started
          .gte('end_date', today);   // Challenge hasn't ended
          
        if (challengesError) throw challengesError;
        
        if (!activeChallengesToday || activeChallengesToday.length === 0) {
          setCompletions([]);
          return;
        }
        
        // Map challenges by ID for easy lookup
        const challengesMap = {};
        activeChallengesToday.forEach(challenge => {
          challengesMap[challenge.id] = challenge;
        });
        
        // Get all exercise logs for today
        const { data: todayLogs, error: logsError } = await supabase
          .from('exercise_logs')
          .select(`
            id,
            user_id,
            challenge_id,
            exercise_count,
            profiles:user_id (username, avatar_url, full_name)
          `)
          .eq('log_date', today)
          .in('challenge_id', activeChallengesToday.map(c => c.id));
          
        if (logsError) throw logsError;
        
        // Filter completions (logs that meet or exceed the challenge goal)
        const completedLogs = [];
        
        todayLogs?.forEach(log => {
          const challenge = challengesMap[log.challenge_id];
          
          // Skip if challenge not found (shouldn't happen)
          if (!challenge) return;
          
          // For daily_count type, check if goal was met
          if (challenge.goal_type === 'daily_count' && log.exercise_count >= challenge.goal_value) {
            completedLogs.push({
              id: log.id,
              userId: log.user_id,
              username: log.profiles?.username || 'User',
              fullName: log.profiles?.full_name,
              avatarUrl: log.profiles?.avatar_url,
              challengeId: log.challenge_id,
              challengeTitle: challenge.title,
              exerciseType: challenge.exercise_type,
              count: log.exercise_count,
              goalValue: challenge.goal_value
            });
          }
          
          // TODO: Handle other goal types if needed
        });
        
        setCompletions(completedLogs);
      } catch (err) {
        console.error('Error fetching daily completions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDailyCompletions();
    
    // Set up a subscription to real-time updates for exercise_logs
    const logsSubscription = supabase
      .channel('public:exercise_logs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'exercise_logs',
          filter: `log_date=eq.${today}`
        }, 
        () => {
          // Refresh the data when logs change
          fetchDailyCompletions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(logsSubscription);
    };
  }, [today]);
  
  const renderAvatar = (user) => {
    if (user.avatarUrl) {
      return (
        <img 
          src={user.avatarUrl} 
          alt={user.username} 
          className="avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`;
          }}
        />
      );
    } else {
      return (
        <div className="avatar-placeholder">
          {user.username.charAt(0).toUpperCase()}
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading completions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p>Error loading completions: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="daily-completions">
      <div className="section-header">
        <h2>Today's Champions</h2>
        <div className="date-badge">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
      </div>
      
      {completions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p>No one has completed their challenge goals yet today.</p>
          <p className="motivational-message">Be the first to reach your goal today!</p>
        </div>
      ) : (
        <div className="completions-list">
          {completions.map((completion) => (
            <div key={completion.id} className="completion-card">
              {renderAvatar(completion)}
              
              <div className="completion-details">
                <div className="user-info">
                  <span className="username">{completion.username}</span>
                  {completion.fullName && <span className="fullname">({completion.fullName})</span>}
                </div>
                
                <div className="challenge-info">
                  <div className="challenge-badge">{completion.exerciseType}</div>
                  <span className="challenge-name">{completion.challengeTitle}</span>
                </div>
                
                <div className="completion-stats">
                  <span className="count-value">{completion.count}</span>
                  <span className="count-separator">/</span>
                  <span className="goal-value">{completion.goalValue}</span>
                  
                  {completion.count > completion.goalValue && (
                    <div className="extra-badge">
                      +{Math.round((completion.count / completion.goalValue - 1) * 100)}%
                    </div>
                  )}
                </div>
              </div>
              
              <div className="completion-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
          ))}
          
          {completions.length > 0 && (
            <div className="completion-footer">
              <p>{completions.length} {completions.length === 1 ? 'person has' : 'people have'} completed their challenge today!</p>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        .daily-completions {
          background-color: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--color-text);
        }
        
        .date-badge {
          background-color: var(--color-primary);
          color: white;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .loading-container, .error-container, .empty-state {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-light);
        }
        
        .loader {
          border: 3px solid var(--color-border);
          border-radius: 50%;
          border-top: 3px solid var(--color-primary);
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 0 auto var(--spacing-md);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-container {
          color: var(--color-error);
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
        
        .empty-state p {
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .motivational-message {
          font-weight: 500;
          color: var(--color-primary);
        }
        
        .completions-list {
          padding: var(--spacing-md);
        }
        
        .completion-card {
          display: flex;
          align-items: center;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          background-color: var(--color-background);
          margin-bottom: var(--spacing-md);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        
        .completion-card:last-child {
          margin-bottom: 0;
        }
        
        .completion-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .avatar, .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-right: var(--spacing-md);
          flex-shrink: 0;
        }
        
        .avatar {
          object-fit: cover;
        }
        
        .avatar-placeholder {
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
        }
        
        .completion-details {
          flex: 1;
          min-width: 0;
        }
        
        .user-info {
          margin-bottom: var(--spacing-xs);
        }
        
        .username {
          font-weight: 600;
          color: var(--color-text);
        }
        
        .fullname {
          color: var(--color-text-light);
          margin-left: var(--spacing-xs);
          font-size: 0.875rem;
        }
        
        .challenge-info {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }
        
        .challenge-badge {
          background-color: rgba(79, 70, 229, 0.1);
          color: var(--color-primary);
          padding: 0.1rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          margin-right: var(--spacing-sm);
          text-transform: capitalize;
        }
        
        .challenge-name {
          font-size: 0.875rem;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .completion-stats {
          display: flex;
          align-items: center;
          color: var(--color-text-light);
          font-size: 0.875rem;
        }
        
        .count-value {
          font-weight: 600;
          color: var(--color-text);
        }
        
        .count-separator {
          margin: 0 0.2rem;
        }
        
        .extra-badge {
          margin-left: var(--spacing-sm);
          background-color: rgba(0, 166, 153, 0.1);
          color: var(--color-success);
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .completion-badge {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          color: var(--color-success);
        }
        
        .completion-footer {
          padding: var(--spacing-md);
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-light);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-md);
        }
        
        .completion-footer p {
          margin: 0;
        }
        
        @media (max-width: 640px) {
          .user-info {
            display: flex;
            flex-direction: column;
          }
          
          .fullname {
            margin-left: 0;
          }
          
          .avatar, .avatar-placeholder {
            width: 40px;
            height: 40px;
          }
        }
      `}
      </style>
    </div>
  );
}