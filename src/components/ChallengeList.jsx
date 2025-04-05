// src/components/ChallengeList.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userChallenges, setUserChallenges] = useState([]);
  const [error, setError] = useState(null);

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
          .select('*')
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
  
  if (loading) return <div>Loading challenges...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="challenge-list">
      <h2>Available Challenges</h2>
      
      {challenges.length === 0 ? (
        <p>No challenges available at the moment.</p>
      ) : (
        <div className="challenges-grid">
          {challenges.map(challenge => (
            <div key={challenge.id} className="challenge-card">
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
              
              <div className="challenge-details">
                <span>Exercise: {challenge.exercise_type}</span>
                <span>Goal: {challenge.goal_value} {challenge.goal_type.replace('_', ' ')}</span>
                <span>Period: {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}</span>
              </div>
              
              {currentUser && (
                <div className="challenge-actions">
                  {userChallenges.includes(challenge.id) ? (
                    <button 
                      onClick={() => leaveChallenge(challenge.id)}
                      className="leave-btn"
                    >
                      Leave Challenge
                    </button>
                  ) : (
                    <button 
                      onClick={() => joinChallenge(challenge.id)}
                      className="join-btn"
                    >
                      Join Challenge
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}