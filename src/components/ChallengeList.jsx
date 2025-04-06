// src/components/ChallengeList.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userChallenges, setUserChallenges] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'upcoming', 'past'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        // Get all challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*, creator:created_by (username, avatar_url)')
          .order('start_date', { ascending: false });
          
        if (challengesError) throw challengesError;
        setChallenges(challengesData || []);
        
        // Get challenges the user has joined
        if (user) {
          const { data: participantData, error: participantError } = await supabase
            .from('challenge_participants')
            .select('challenge_id')
            .eq('user_id', user.id);
            
          if (participantError) throw participantError;
          
          setUserChallenges(participantData ? participantData.map(p => p.challenge_id) : []);
        }
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Subscribe to changes in the challenges table
    const challengeSubscription = supabase
      .channel('public:challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, fetchData)
      .subscribe();
      
    return () => {
      supabase.removeChannel(challengeSubscription);
    };
  }, []);
  
  const joinChallenge = async (challengeId) => {
    try {
      if (!currentUser) return;
      
      const { error } = await supabase
        .from('challenge_participants')
        .insert([
          { challenge_id: challengeId, user_id: currentUser.id }
        ]);
        
      if (error) throw error;
      
      // Update local state
      setUserChallenges([...userChallenges, challengeId]);
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError(err.message);
    }
  };
  
  const leaveChallenge = async (challengeId) => {
    try {
      if (!currentUser) return;
      
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .match({ challenge_id: challengeId, user_id: currentUser.id });
        
      if (error) throw error;
      
      // Update local state
      setUserChallenges(userChallenges.filter(id => id !== challengeId));
    } catch (err) {
      console.error('Error leaving challenge:', err);
      setError(err.message);
    }
  };
  
  const filteredChallenges = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'active':
        return challenges.filter(challenge => 
          challenge.start_date <= today && challenge.end_date >= today
        );
      case 'upcoming':
        return challenges.filter(challenge => 
          challenge.start_date > today
        );
      case 'past':
        return challenges.filter(challenge => 
          challenge.end_date < today
        );
      case 'joined':
        return challenges.filter(challenge => 
          userChallenges.includes(challenge.id)
        );
      default:
        return challenges;
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading challenges...</p>
      </div>
    );
  }
  
  return (
    <div className="challenge-list">
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
      
      <div className="filter-controls">
        <div className="filter-label">Filter:</div>
        <div className="filter-options">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
          <button 
            className={`filter-btn ${filter === 'joined' ? 'active' : ''}`}
            onClick={() => setFilter('joined')}
          >
            Joined
          </button>
        </div>
      </div>
      
      {filteredChallenges().length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>No challenges found</h3>
          <p>Try changing your filter or check back later for new challenges.</p>
        </div>
      ) : (
        <div className="challenge-grid">
          {filteredChallenges().map(challenge => {
            const isJoined = userChallenges.includes(challenge.id);
            const today = new Date().toISOString().split('T')[0];
            const status = 
              challenge.start_date > today ? 'upcoming' : 
              challenge.end_date < today ? 'past' : 'active';
              
            return (
              <div key={challenge.id} className={`challenge-card ${status}`}>
                <div className="card-header">
                  <div className="challenge-status">{status}</div>
                  <h3 className="challenge-title">{challenge.title}</h3>
                  <div className="challenge-type">{challenge.exercise_type}</div>
                </div>
                
                <div className="card-body">
                  <p className="challenge-description">
                    {challenge.description || 'No description provided.'}
                  </p>
                  
                  <div className="challenge-meta">
                    <div className="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>
                        {new Date(challenge.start_date).toLocaleDateString()} - 
                        {new Date(challenge.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      <span>
                        Goal: {challenge.goal_value} {challenge.goal_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {challenge.creator && (
                      <div className="meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Created by: {challenge.creator.username || 'Admin'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  {status === 'active' && (
                    <a href={`/challenges/${challenge.id}`} className="btn btn-secondary btn-sm view-btn">
                      View Details
                    </a>
                  )}
                  
                  {currentUser && status !== 'past' && (
                    isJoined ? (
                      <button 
                        onClick={() => leaveChallenge(challenge.id)}
                        className="btn btn-outline btn-sm leave-btn"
                      >
                        Leave Challenge
                      </button>
                    ) : (
                      <button 
                        onClick={() => joinChallenge(challenge.id)}
                        className="btn btn-primary btn-sm join-btn"
                      >
                        Join Challenge
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        .challenge-list {
          margin-top: var(--spacing-md);
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
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-xl);
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
        
        .filter-controls {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          box-shadow: var(--shadow-sm);
        }
        
        .filter-label {
          font-weight: 500;
          margin-right: var(--spacing-md);
          color: var(--color-text-light);
        }
        
        .filter-options {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .filter-btn {
          background: none;
          border: none;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-btn:hover {
          background-color: var(--color-background);
        }
        
        .filter-btn.active {
          background-color: var(--color-primary);
          color: white;
        }
        
        .challenge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .challenge-card {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          border-top: 3px solid var(--color-border);
        }
        
        .challenge-card.active {
          border-top-color: var(--color-primary);
        }
        
        .challenge-card.upcoming {
          border-top-color: var(--color-secondary);
        }
        
        .challenge-card.past {
          border-top-color: var(--color-text-light);
        }
        
        .card-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .challenge-status {
          display: inline-block;
          padding: 0.1rem 0.5rem;
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--spacing-xs);
        }
        
        .active .challenge-status {
          background-color: rgba(255, 90, 95, 0.1);
          color: var(--color-primary);
        }
        
        .upcoming .challenge-status {
          background-color: rgba(0, 166, 153, 0.1);
          color: var(--color-secondary);
        }
        
        .past .challenge-status {
          background-color: rgba(118, 118, 118, 0.1);
          color: var(--color-text-light);
        }
        
        .challenge-title {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.1rem;
        }
        
        .challenge-type {
          font-size: 0.875rem;
          color: var(--color-text-light);
          text-transform: capitalize;
        }
        
        .card-body {
          padding: var(--spacing-md);
          flex: 1;
        }
        
        .challenge-description {
          margin-bottom: var(--spacing-md);
          font-size: 0.9rem;
          color: var(--color-text);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-xs);
          font-size: 0.8rem;
          color: var(--color-text-light);
        }
        
        .meta-item:last-child {
          margin-bottom: 0;
        }
        
        .card-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .view-btn, .join-btn, .leave-btn {
          flex: 1;
        }
        
        .past .card-footer {
          opacity: 0.7;
        }
        
        @media (max-width: 768px) {
          .filter-controls {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .filter-label {
            margin-bottom: var(--spacing-xs);
          }
          
          .filter-options {
            width: 100%;
          }
          
          .filter-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}