// src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Leaderboard({ challengeId }) {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('today'); // 'today', 'week', 'month', 'all'
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Helper function to validate UUID format
  const isValidUUID = (str) => {
    // Empty string is valid (no filter)
    if (str === '') return true;
    if (!str) return false;
    
    // UUID regex pattern (simple version)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(str);
  };
  
  useEffect(() => {
    // Get current user
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get today's date as YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Prepare query
        let query = supabase
          .from('exercise_logs')
          .select(`
            id,
            user_id,
            challenge_id,
            exercise_count,
            log_date,
            profiles:user_id (username, avatar_url)
          `);
        
        // Add challenge filter if provided
        if (challengeId && challengeId !== '') {
          // Check if it's a valid UUID
          if (!isValidUUID(challengeId)) {
            throw new Error('Invalid challenge ID format');
          }
          query = query.eq('challenge_id', challengeId);
        }
        
        // Apply time frame filter
        if (timeFrame === 'today') {
          // Strict equality for today's date only
          query = query.eq('log_date', todayStr);
        } 
        else if (timeFrame === 'week') {
          // Get date 7 days ago
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          
          query = query.gte('log_date', weekAgoStr)
                       .lte('log_date', todayStr);
        } 
        else if (timeFrame === 'month') {
          // Get date 30 days ago
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          const monthAgoStr = monthAgo.toISOString().split('T')[0];
          
          query = query.gte('log_date', monthAgoStr)
                       .lte('log_date', todayStr);
        }
        // For 'all', no date filter is applied
        
        // Execute query
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;

        // Process and aggregate results by user
        const userTotals = {};
        
        data?.forEach(log => {
          const userId = log.user_id;
          
          if (!userTotals[userId]) {
            userTotals[userId] = {
              userId,
              username: log.profiles?.username || 'Anonymous User',
              avatarUrl: log.profiles?.avatar_url,
              totalCount: 0,
              isCurrentUser: currentUser?.id === userId,
              logDates: [] // Track which dates were included
            };
          }
          
          userTotals[userId].totalCount += log.exercise_count;
          userTotals[userId].logDates.push(log.log_date);
        });
        
        // Convert to array and sort by exercise count
        const sortedLeaderboard = Object.values(userTotals)
          .sort((a, b) => b.totalCount - a.totalCount)
          .slice(0, 10); // Top 10
          
        setLeaderboardData(sortedLeaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
    
    // Subscribe to real-time updates for exercise_logs
    const exerciseLogsSubscription = supabase
      .channel('public:exercise_logs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'exercise_logs'
        }, 
        () => {
          // Refresh data when changes occur
          fetchLeaderboard();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(exerciseLogsSubscription);
    };
  }, [challengeId, timeFrame, currentUser]);
  
  const renderAvatarOrInitial = (user) => {
    if (user.avatarUrl) {
      return (
        <img 
          src={user.avatarUrl} 
          alt={user.username} 
          className="user-avatar"
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
  
  const getTimeFrameLabel = () => {
    switch(timeFrame) {
      case 'today': return "Today's Leaderboard";
      case 'week': return "This Week's Leaderboard";
      case 'month': return "This Month's Leaderboard";
      case 'all': return "All-Time Leaderboard";
      default: return "Leaderboard";
    }
  };
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="timeframe-label">{getTimeFrameLabel()}</div>
        <div className="time-filter">
          <button 
            onClick={() => setTimeFrame('today')}
            className={`filter-btn ${timeFrame === 'today' ? 'active' : ''}`}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeFrame('week')}
            className={`filter-btn ${timeFrame === 'week' ? 'active' : ''}`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeFrame('month')}
            className={`filter-btn ${timeFrame === 'month' ? 'active' : ''}`}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeFrame('all')}
            className={`filter-btn ${timeFrame === 'all' ? 'active' : ''}`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading leaderboard data...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>Error loading leaderboard: {error}</p>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="empty-state">
          <p>No exercise data available for this time period.</p>
          {timeFrame === 'today' && (
            <p className="motivational-message">Be the first to log your exercises today!</p>
          )}
        </div>
      ) : (
        <div className="leaderboard-table">
          {leaderboardData.map((user, index) => (
            <div 
              key={user.userId} 
              className={`leaderboard-row ${index < 3 ? `top-${index+1}` : ''} ${user.isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank-column">
                {index < 3 ? (
                  <div className={`medal rank-${index+1}`}>{index + 1}</div>
                ) : (
                  <div className="rank">{index + 1}</div>
                )}
              </div>
              
              <div className="user-column">
                {renderAvatarOrInitial(user)}
                <span className="username">{user.username}{user.isCurrentUser ? ' (You)' : ''}</span>
              </div>
              
              <div className="count-column">
                <span className="count">{user.totalCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .leaderboard {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        
        .leaderboard-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .timeframe-label {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text);
        }
        
        .time-filter {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
          margin-top: var(--spacing-md);
        }
        
        .filter-btn {
          background: none;
          border: 1px solid var(--color-border);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--color-text);
          transition: all 0.2s;
        }
        
        .filter-btn:hover {
          background-color: var(--color-background);
        }
        
        .filter-btn.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        
        .loading-state, .error-state, .empty-state {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-light);
        }
        
        .motivational-message {
          font-weight: 500;
          color: var(--color-primary);
          margin-top: var(--spacing-sm);
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
        
        .error-state {
          color: var(--color-error);
        }
        
        .leaderboard-table {
          padding: var(--spacing-sm) 0;
        }
        
        .leaderboard-row {
          display: flex;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          transition: background-color 0.2s;
        }
        
        .leaderboard-row:hover {
          background-color: var(--color-background);
        }
        
        .leaderboard-row.current-user {
          background-color: rgba(79, 70, 229, 0.05);
        }
        
        .top-1 {
          background-color: rgba(255, 215, 0, 0.05);
        }
        
        .top-2 {
          background-color: rgba(192, 192, 192, 0.05);
        }
        
        .top-3 {
          background-color: rgba(205, 127, 50, 0.05);
        }
        
        .rank-column {
          width: 40px;
          flex-shrink: 0;
          text-align: center;
        }
        
        .rank {
          font-weight: 600;
          color: var(--color-text-light);
          font-size: 0.9rem;
        }
        
        .medal {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--color-white);
          margin: 0 auto;
        }
        
        .rank-1 {
          background-color: #FFD700; /* Gold */
        }
        
        .rank-2 {
          background-color: #C0C0C0; /* Silver */
        }
        
        .rank-3 {
          background-color: #CD7F32; /* Bronze */
        }
        
        .user-column {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
          min-width: 0;
        }
        
        .user-avatar, .avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .user-avatar {
          object-fit: cover;
        }
        
        .avatar-placeholder {
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .username {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .count-column {
          width: 80px;
          flex-shrink: 0;
          text-align: right;
        }
        
        .count {
          font-weight: 700;
          color: var(--color-primary);
        }
        
        @media (max-width: 480px) {
          .time-filter {
            justify-content: space-between;
          }
          
          .filter-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            font-size: 0.7rem;
          }
          
          .username {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}