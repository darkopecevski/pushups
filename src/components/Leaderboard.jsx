// src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Leaderboard({ challengeId }) {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('today'); // 'today', 'week', 'month', 'all'
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let startDate;
        const today = new Date();
        
        // Determine date range based on time frame
        if (timeFrame === 'today') {
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
        } else if (timeFrame === 'week') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
        } else if (timeFrame === 'month') {
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
        }
        
        // Format date for query
        const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
        
        // Build query
        let query = supabase
          .from('exercise_logs')
          .select(`
            user_id,
            exercise_count,
            log_date,
            profiles:user_id (username, avatar_url)
          `)
          .order('exercise_count', { ascending: false });
          
        // Add challenge filter if provided
        if (challengeId) {
          query = query.eq('challenge_id', challengeId);
        }
        
        // Add date filter if not 'all'
        if (timeFrame !== 'all' && formattedStartDate) {
          query = query.gte('log_date', formattedStartDate);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Process data to aggregate by user
        const userTotals = {};
        
        data.forEach(log => {
          const userId = log.user_id;
          
          if (!userTotals[userId]) {
            userTotals[userId] = {
              userId,
              username: log.profiles?.username || 'Anonymous User',
              avatarUrl: log.profiles?.avatar_url,
              totalCount: 0
            };
          }
          
          userTotals[userId].totalCount += log.exercise_count;
        });
        
        // Convert to array and sort
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
  }, [challengeId, timeFrame]);
  
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
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
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
        </div>
      ) : (
        <div className="leaderboard-table">
          {leaderboardData.map((user, index) => (
            <div 
              key={user.userId} 
              className={`leaderboard-row ${index < 3 ? `top-${index+1}` : ''}`}
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
                <span className="username">{user.username}</span>
              </div>
              
              <div className="count-column">
                <span className="count">{user.totalCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
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
        
        .time-filter {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
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