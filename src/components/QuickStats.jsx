// src/components/QuickStats.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function QuickStats({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalExercises: 0,
    activeDaysLastWeek: 0,
    challengeCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        console.error("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get total exercise count
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercise_logs')
          .select('exercise_count')
          .eq('user_id', userId);
          
        if (exerciseError) {
          console.error("Error fetching exercise data:", exerciseError);
          throw exerciseError;
        }
        
        // Calculate total exercises
        const totalExercises = exerciseData?.reduce((sum, log) => sum + (log.exercise_count || 0), 0) || 0;
        
        // Get last 7 days logs
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last7DaysFormatted = last7Days.toISOString().split('T')[0];
        
        const { data: recentLogs, error: recentLogsError } = await supabase
          .from('exercise_logs')
          .select('log_date')
          .eq('user_id', userId)
          .gte('log_date', last7DaysFormatted);
          
        if (recentLogsError) {
          console.error("Error fetching recent logs:", recentLogsError);
          throw recentLogsError;
        }
        
        // Calculate active days in last week - using Set for unique dates
        const uniqueDates = new Set();
        recentLogs?.forEach(log => {
          if (log.log_date) uniqueDates.add(log.log_date);
        });
        const activeDaysLastWeek = uniqueDates.size || 0;
        
        // Get joined challenges count
        let challengeCount = 0;
        try {
          const { data: challengeData, error: challengeCountError } = await supabase
            .from('challenge_participants')
            .select('challenge_id')
            .eq('user_id', userId);
            
          if (challengeCountError) {
            console.error("Error fetching challenge count:", challengeCountError);
            // Don't throw, just log and continue with zero
          } else {
            challengeCount = challengeData?.length || 0;
          }
        } catch (challengeErr) {
          console.error("Error in challenge count calculation:", challengeErr);
          // Continue with zero challenges if there was an error
        }

        // Update state with all stats
        setStats({
          totalExercises,
          activeDaysLastWeek,
          challengeCount
        });

      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="stats-grid">
        <div className="stat-card skeleton">
          <div className="stat-icon skeleton-icon"></div>
          <div className="stat-content">
            <div className="stat-value skeleton-text"></div>
            <div className="stat-label skeleton-text"></div>
          </div>
        </div>
        <div className="stat-card skeleton">
          <div className="stat-icon skeleton-icon"></div>
          <div className="stat-content">
            <div className="stat-value skeleton-text"></div>
            <div className="stat-label skeleton-text"></div>
          </div>
        </div>
        <div className="stat-card skeleton">
          <div className="stat-icon skeleton-icon"></div>
          <div className="stat-content">
            <div className="stat-value skeleton-text"></div>
            <div className="stat-label skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Failed to load stats. Please refresh the page.</span>
      </div>
    );
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalExercises.toLocaleString()}</div>
          <div className="stat-label">Total Exercises</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.activeDaysLastWeek}</div>
          <div className="stat-label">Active Days (Last 7)</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.challengeCount}</div>
          <div className="stat-label">Challenges Joined</div>
        </div>
      </div>

      <style>
        {`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: var(--spacing-md);
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: var(--color-primary);
          opacity: 0.7;
        }
        
        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          margin-right: var(--spacing-md);
          flex-shrink: 0;
          background-color: rgba(255, 90, 95, 0.1);
          color: var(--color-primary);
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1.2;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 0.825rem;
          color: var(--color-text-light);
          font-weight: 500;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          color: var(--color-error);
          text-align: center;
          padding: var(--spacing-md);
          background-color: rgba(255, 90, 95, 0.1);
          border-radius: var(--radius-md);
        }
        
        /* Skeleton loading */
        .skeleton {
          position: relative;
          overflow: hidden;
        }
        
        .skeleton-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: var(--color-background);
          margin-right: var(--spacing-md);
        }
        
        .skeleton-text {
          height: 1.2em;
          border-radius: var(--radius-sm);
          background-color: var(--color-background);
          margin-bottom: 0.5em;
        }
        
        .skeleton-text:last-child {
          margin-bottom: 0;
          width: 70%;
        }
        
        .skeleton::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, 
            var(--color-background) 0%, 
            var(--color-white) 50%, 
            var(--color-background) 100%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        @media (max-width: 640px) {
          .stat-card {
            padding: var(--spacing-sm);
          }
          
          .stat-icon {
            width: 40px;
            height: 40px;
          }
          
          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}
      </style>
    </div>
  );
}