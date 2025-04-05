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
              username: log.profiles.username || 'Anonymous User',
              avatarUrl: log.profiles.avatar_url,
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
  
  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div className="error">Error loading leaderboard: {error}</div>;
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>Leaderboard</h3>
        
        <div className="time-filter">
          <button 
            onClick={() => setTimeFrame('today')}
            className={timeFrame === 'today' ? 'active' : ''}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeFrame('week')}
            className={timeFrame === 'week' ? 'active' : ''}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeFrame('month')}
            className={timeFrame === 'month' ? 'active' : ''}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeFrame('all')}
            className={timeFrame === 'all' ? 'active' : ''}
          >
            All Time
          </button>
        </div>
      </div>
      
      {leaderboardData.length === 0 ? (
        <div className="no-data">
          No exercise data available for this time period.
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboardData.map((user, index) => (
            <div key={user.userId} className="leaderboard-item">
              <div className="rank">{index + 1}</div>
              
              <div className="user-info">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="username">{user.username}</span>
              </div>
              
              <div className="count">{user.totalCount}</div>
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .leaderboard {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .leaderboard-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .leaderboard-header h3 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .time-filter {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .time-filter button {
          background: none;
          border: 1px solid #e5e7eb;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .time-filter button.active {
          background-color: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        
        .no-data {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .leaderboard-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .leaderboard-item:last-child {
          border-bottom: none;
        }
        
        .rank {
          font-weight: bold;
          width: 2rem;
          text-align: center;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 0.75rem;
        }
        
        .avatar, .avatar-placeholder {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          background-color: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .username {
          font-weight: 500;
        }
        
        .count {
          font-weight: bold;
          color: #4f46e5;
        }
      `}</style>
    </div>
  );
}