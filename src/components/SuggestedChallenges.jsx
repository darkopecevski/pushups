import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/SuggestedChallenges.css';

export default function SuggestedChallenges({ userId, limit = 3 }) {
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        
        if (!userId) {
          setAvailableChallenges([]);
          return;
        }
        
        // Get current date for filtering active challenges
        const today = new Date().toISOString().split('T')[0];
        
        // Get challenges the user has joined
        const { data: participantData } = await supabase
          .from('challenge_participants')
          .select('challenge_id')
          .eq('user_id', userId);
          
        const userChallengeIds = participantData ? participantData.map(p => p.challenge_id) : [];
        
        // Get the challenges the user has declined
        const { data: declinedInvites } = await supabase
          .from('challenge_invites')
          .select('challenge_id')
          .eq('email', (await supabase.auth.getUser()).data.user.email)
          .eq('status', 'declined');
          
        const declinedChallengeIds = declinedInvites ? declinedInvites.map(i => i.challenge_id) : [];
        
        // Combine both arrays to get all challenge IDs to exclude
        const excludedChallengeIds = [...userChallengeIds, ...declinedChallengeIds];
        
        // Get available challenges that user hasn't joined or declined
        const { data: allChallenges } = await supabase
          .from('challenges')
          .select('*')
          .gte('end_date', today) // Only show challenges that haven't ended
          .order('start_date', { ascending: true });
          
        if (allChallenges) {
          const filteredChallenges = allChallenges
            .filter(challenge => !excludedChallengeIds.includes(challenge.id))
            .slice(0, limit); // Limit to specified number of challenges
            
          setAvailableChallenges(filteredChallenges);
        }
      } catch (err) {
        console.error('Error fetching suggested challenges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallenges();
  }, [userId, limit]);
  
  const joinChallenge = async (challengeId) => {
    try {
      const button = document.querySelector(`.join-challenge-btn[data-id="${challengeId}"]`);
      if (button) {
        button.disabled = true;
        button.textContent = 'Joining...';
      }
      
      const { error } = await supabase
        .from('challenge_participants')
        .insert([
          { challenge_id: challengeId, user_id: userId }
        ]);
        
      if (error) throw error;
      
      // Update the local state without reloading
      setAvailableChallenges(prev => prev.filter(challenge => challenge.id !== challengeId));
    } catch (err) {
      console.error('Error joining challenge:', err);
      alert('Error joining challenge: ' + err.message);
      
      const button = document.querySelector(`.join-challenge-btn[data-id="${challengeId}"]`);
      if (button) {
        button.disabled = false;
        button.textContent = 'Join Challenge';
      }
    }
  };
  
  if (loading) {
    return (
      <div className="challenge-suggestions loading">
        <div className="suggestion-card skeleton"></div>
        <div className="suggestion-card skeleton"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="empty-suggestions">
        <p>Error loading challenges: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="challenge-suggestions">
      {availableChallenges.length > 0 ? (
        <>
          {availableChallenges.map(challenge => (
            <div className="suggestion-card" key={challenge.id}>
              <div className="suggestion-header">
                <span className="suggestion-type">{challenge.exercise_type}</span>
                <h3>{challenge.title}</h3>
              </div>
              
              <div className="suggestion-body">
                <div className="suggestion-meta">
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
                </div>
                
                <button 
                  className="btn btn-primary btn-sm join-challenge-btn" 
                  data-id={challenge.id}
                  onClick={() => joinChallenge(challenge.id)}
                >
                  Join Challenge
                </button>
              </div>
            </div>
          ))}
          
          <a href="/challenges" className="view-all-link">
            View all available challenges
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </a>
        </>
      ) : (
        <div className="empty-suggestions">
          <p>No new challenges available at the moment.</p>
          <a href="/challenges" className="btn btn-outline btn-sm">Browse All Challenges</a>
        </div>
      )}
    </div>
  );
} 