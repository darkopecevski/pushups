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
  const [invitations, setInvitations] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [challengeInvites, setChallengeInvites] = useState([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState('public');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        let visibleChallenges = [];
        
        if (user && user.email) {
          // For logged in users: Get public challenges AND private challenges they've been invited to
          
          // First get all public challenges
          const { data: publicChallenges, error: publicError } = await supabase
            .from('challenges')
            .select('*, creator:created_by (username, avatar_url)')
            .eq('visibility', 'public')
            .order('start_date', { ascending: false });
            
          if (publicError) throw publicError;
          
          // Get private challenges where user is invited
          const { data: privateInvites, error: inviteError } = await supabase
            .from('challenge_invites')
            .select('challenge_id, status')
            .eq('email', user.email);
            
          if (inviteError) throw inviteError;
          
          // Get private challenge details for invited challenges
          let privateChallenges = [];
          if (privateInvites && privateInvites.length > 0) {
            // Filter out declined invitations
            const nonDeclinedInvites = privateInvites.filter(invite => invite.status !== 'declined');
            
            if (nonDeclinedInvites.length > 0) {
              const invitedChallengeIds = nonDeclinedInvites.map(invite => invite.challenge_id);
              
              const { data: privateData, error: privateError } = await supabase
                .from('challenges')
                .select('*, creator:created_by (username, avatar_url)')
                .eq('visibility', 'private')
                .in('id', invitedChallengeIds)
                .order('start_date', { ascending: false });
                
              if (privateError) throw privateError;
              privateChallenges = privateData || [];
              
              // Mark which ones are invitations vs already joined
              const pendingInvites = nonDeclinedInvites.filter(invite => invite.status === 'pending');
              const pendingInviteChallenges = pendingInvites.map(invite => {
                const challenge = privateChallenges.find(c => c.id === invite.challenge_id);
                return challenge ? { ...challenge, invitation_status: 'pending' } : null;
              }).filter(Boolean);
              
              setInvitations(pendingInviteChallenges);
            } else {
              // No non-declined invites, set empty arrays
              privateChallenges = [];
              setInvitations([]);
            }
          }
          
          // Check if user is admin
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
            
          const userIsAdmin = profileData?.is_admin || false;
          setIsAdmin(userIsAdmin);
          
          if (userIsAdmin) {
            // Admins can see all challenges
            const { data: allChallenges, error: allError } = await supabase
              .from('challenges')
              .select('*, creator:created_by (username, avatar_url)')
              .order('start_date', { ascending: false });
              
            if (allError) throw allError;
            visibleChallenges = allChallenges || [];
          } else {
            // Regular users see public + invited private challenges
            visibleChallenges = [...(publicChallenges || []), ...(privateChallenges || [])];
          }
        } else {
          // For non-logged in users, only show public challenges
          const { data: publicChallenges, error: publicError } = await supabase
            .from('challenges')
            .select('*, creator:created_by (username, avatar_url)')
            .eq('visibility', 'public')
            .order('start_date', { ascending: false });
            
          if (publicError) throw publicError;
          visibleChallenges = publicChallenges || [];
        }
        
        setChallenges(visibleChallenges);
        
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
      
    // Subscribe to changes in the challenge_invites table
    const invitesSubscription = supabase
      .channel('public:challenge_invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_invites' }, fetchData)
      .subscribe();
      
    return () => {
      supabase.removeChannel(challengeSubscription);
      supabase.removeChannel(invitesSubscription);
    };
  }, []);
  
  const joinChallenge = async (challengeId) => {
    try {
      if (!currentUser) return;
      
      // Insert into challenge_participants
      const { error } = await supabase
        .from('challenge_participants')
        .insert([
          { challenge_id: challengeId, user_id: currentUser.id }
        ]);
        
      if (error) throw error;
      
      // If joining from an invitation, update the invitation status
      if (currentUser.email) {
        await supabase
          .from('challenge_invites')
          .update({ status: 'accepted' })
          .match({ challenge_id: challengeId, email: currentUser.email });
      }
      
      // Update local state
      setUserChallenges([...userChallenges, challengeId]);
      
      // Remove from invitations list if it was there
      setInvitations(invitations.filter(invite => invite.id !== challengeId));
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
  
  const declineInvitation = async (challengeId) => {
    try {
      if (!currentUser || !currentUser.email) return;
      
      // Update invitation status to declined
      const { error } = await supabase
        .from('challenge_invites')
        .update({ status: 'declined' })
        .match({ challenge_id: challengeId, email: currentUser.email });
        
      if (error) throw error;
      
      // Update local state
      setInvitations(invitations.filter(invite => invite.id !== challengeId));
      
      // Also remove the challenge from the list
      setChallenges(challenges.filter(challenge => challenge.id !== challengeId));
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err.message);
    }
  };
  
  const deleteChallenge = async (challengeId) => {
    try {
      if (!isAdmin) {
        setError("Only admins can delete challenges");
        return;
      }
      
      // Show confirmation dialog
      if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
        return;
      }
      
      // First, delete related records
      
      // 1. Delete challenge participants
      const { error: participantsError } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId);
        
      if (participantsError) {
        console.error('Error deleting challenge participants:', participantsError);
      }
      
      // 2. Delete exercise logs
      const { error: logsError } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('challenge_id', challengeId);
        
      if (logsError) {
        console.error('Error deleting exercise logs:', logsError);
      }
      
      // 3. Delete challenge invites
      const { error: invitesError } = await supabase
        .from('challenge_invites')
        .delete()
        .eq('challenge_id', challengeId);
        
      if (invitesError) {
        console.error('Error deleting challenge invites:', invitesError);
      }
      
      // Now delete the challenge itself
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);
        
      if (error) throw error;
      
      // Update local state
      setChallenges(challenges.filter(challenge => challenge.id !== challengeId));
    } catch (err) {
      console.error('Error deleting challenge:', err);
      setError(err.message);
    }
  };
  
  const editChallenge = async (updatedChallenge) => {
    try {
      if (!isAdmin) {
        setError("Only admins can edit challenges");
        return;
      }
      
      const { error } = await supabase
        .from('challenges')
        .update({
          title: updatedChallenge.title,
          description: updatedChallenge.description,
          exercise_type: updatedChallenge.exercise_type,
          goal_type: updatedChallenge.goal_type,
          goal_value: updatedChallenge.goal_value,
          start_date: updatedChallenge.start_date,
          end_date: updatedChallenge.end_date,
          visibility: updatedChallenge.visibility
        })
        .eq('id', updatedChallenge.id);
        
      if (error) throw error;
      
      // Update local state
      setChallenges(challenges.map(challenge => 
        challenge.id === updatedChallenge.id ? { ...challenge, ...updatedChallenge } : challenge
      ));
      
      // Close modal and reset editing challenge
      setShowEditModal(false);
      setEditingChallenge(null);
    } catch (err) {
      console.error('Error updating challenge:', err);
      setError(err.message);
    }
  };
  
  const loadChallengeInvites = async (challengeId) => {
    if (!challengeId) return;
    
    try {
      setLoadingInvites(true);
      
      const { data, error } = await supabase
        .from('challenge_invites')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setChallengeInvites(data || []);
    } catch (err) {
      console.error('Error loading challenge invites:', err);
      setError(err.message);
    } finally {
      setLoadingInvites(false);
    }
  };
  
  const addInvite = async (challengeId, email) => {
    try {
      if (!email || !email.trim()) {
        setError("Please enter a valid email address");
        return;
      }
      
      const { error } = await supabase
        .from('challenge_invites')
        .insert([
          { 
            challenge_id: challengeId, 
            email: email.trim(),
            status: 'pending'
          }
        ]);
        
      if (error) throw error;
      
      // Clear input and reload invites
      setNewInviteEmail('');
      await loadChallengeInvites(challengeId);
    } catch (err) {
      console.error('Error adding invite:', err);
      setError(err.message);
    }
  };
  
  const removeInvite = async (inviteId, challengeId) => {
    try {
      const { error } = await supabase
        .from('challenge_invites')
        .delete()
        .eq('id', inviteId);
        
      if (error) throw error;
      
      // Reload invites
      await loadChallengeInvites(challengeId);
    } catch (err) {
      console.error('Error removing invite:', err);
      setError(err.message);
    }
  };
  
  const deleteAllInvites = async (challengeId) => {
    try {
      const { error } = await supabase
        .from('challenge_invites')
        .delete()
        .eq('challenge_id', challengeId);
        
      if (error) throw error;
      
      // Clear invites list
      setChallengeInvites([]);
    } catch (err) {
      console.error('Error deleting all invites:', err);
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
      
      {/* Invitations Section */}
      {currentUser && invitations.length > 0 && (
        <div className="invitations-section">
          <h2 className="section-title">Challenge Invitations</h2>
          <div className="invitation-list">
            {invitations.map(invitation => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-content">
                  <h3>{invitation.title}</h3>
                  <p>{invitation.description || 'No description provided.'}</p>
                  <div className="invitation-meta">
                    <span>
                      {new Date(invitation.start_date).toLocaleDateString()} - 
                      {new Date(invitation.end_date).toLocaleDateString()}
                    </span>
                    <span>
                      {invitation.exercise_type} - Goal: {invitation.goal_value} {invitation.goal_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="invitation-actions">
                  <button 
                    onClick={() => joinChallenge(invitation.id)}
                    className="btn btn-primary btn-sm join-btn"
                  >
                    Accept & Join
                  </button>
                  <button 
                    onClick={() => declineInvitation(invitation.id)}
                    className="btn btn-outline btn-sm decline-btn"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                  <div className="challenge-meta-top">
                    <div className="challenge-status">{status}</div>
                    <div className={`visibility-badge ${challenge.visibility || 'public'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {challenge.visibility === 'private' ? (
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
                        ) : (
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        )}
                        {challenge.visibility === 'private' ? null : <circle cx="12" cy="12" r="3"></circle>}
                      </svg>
                      <span>{challenge.visibility || 'public'}</span>
                    </div>
                  </div>
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
                  
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingChallenge(challenge);
                          setShowEditModal(true);
                          setCurrentVisibility(challenge.visibility || 'public');
                          loadChallengeInvites(challenge.id);
                        }}
                        className="btn btn-secondary btn-sm edit-btn"
                        title="Edit Challenge"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteChallenge(challenge.id)}
                        className="btn btn-error btn-sm delete-btn"
                        title="Delete Challenge"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </>
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
        
        /* Invitations Section */
        .invitations-section {
          margin-bottom: var(--spacing-xl);
        }
        
        .section-title {
          font-size: 1.2rem;
          margin-bottom: var(--spacing-md);
          font-weight: 600;
        }
        
        .invitation-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .invitation-card {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid var(--color-primary);
        }
        
        .invitation-content {
          flex: 1;
        }
        
        .invitation-content h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.1rem;
        }
        
        .invitation-content p {
          margin-bottom: var(--spacing-xs);
          color: var(--color-text);
          font-size: 0.9rem;
        }
        
        .invitation-meta {
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
          color: var(--color-text-light);
        }
        
        .invitation-actions {
          display: flex;
          gap: var(--spacing-xs);
        }
        
        /* Challenge Card Updates */
        .challenge-meta-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }
        
        .visibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          text-transform: capitalize;
        }
        
        .visibility-badge.public {
          background-color: rgba(25, 135, 84, 0.1);
          color: rgb(25, 135, 84);
        }
        
        .visibility-badge.private {
          background-color: rgba(108, 117, 125, 0.1);
          color: rgb(108, 117, 125);
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
        
        .edit-btn {
          background-color: rgba(33, 150, 243, 0.1);
          color: rgb(33, 150, 243);
          border: 1px solid rgba(33, 150, 243, 0.2);
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--spacing-xs);
        }
        
        .edit-btn:hover {
          background-color: rgb(33, 150, 243);
          color: white;
        }
        
        .delete-btn {
          background-color: rgba(220, 53, 69, 0.1);
          color: rgb(220, 53, 69);
          border: 1px solid rgba(220, 53, 69, 0.2);
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .delete-btn:hover {
          background-color: rgb(220, 53, 69);
          color: white;
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
          
          .invitation-card {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .invitation-content {
            margin-bottom: var(--spacing-md);
          }
          
          .invitation-actions {
            width: 100%;
          }
          
          .invitation-actions button {
            flex: 1;
          }
        }
        
        /* Edit Challenge Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        
        .modal-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-title {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--color-text-light);
        }
        
        .modal-body {
          padding: var(--spacing-lg);
        }
        
        .modal-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }
        
        .form-group {
          margin-bottom: var(--spacing-md);
        }
        
        .form-label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
        }
        
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
        }
        
        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        /* Invitations Management in Modal */
        .modal-section {
          padding: 0 var(--spacing-lg) var(--spacing-lg);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-lg);
        }
        
        .section-title {
          margin: var(--spacing-md) 0;
          font-size: 1.1rem;
        }
        
        .invite-form {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }
        
        .invites-list h5 {
          font-size: 0.9rem;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-light);
        }
        
        .loading-text, .empty-text {
          font-size: 0.9rem;
          color: var(--color-text-light);
          text-align: center;
          padding: var(--spacing-md);
        }
        
        .invites-table {
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        
        .invite-item {
          display: flex;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .invite-item:last-child {
          border-bottom: none;
        }
        
        .invite-item.pending {
          background-color: rgba(255, 193, 7, 0.05);
        }
        
        .invite-item.accepted {
          background-color: rgba(25, 135, 84, 0.05);
        }
        
        .invite-item.declined {
          background-color: rgba(220, 53, 69, 0.05);
        }
        
        .invite-email {
          flex: 1;
          font-weight: 500;
        }
        
        .invite-status {
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          text-transform: uppercase;
          margin-right: var(--spacing-md);
        }
        
        .invite-item.pending .invite-status {
          background-color: rgba(255, 193, 7, 0.1);
          color: rgb(255, 193, 7);
        }
        
        .invite-item.accepted .invite-status {
          background-color: rgba(25, 135, 84, 0.1);
          color: rgb(25, 135, 84);
        }
        
        .invite-item.declined .invite-status {
          background-color: rgba(220, 53, 69, 0.1);
          color: rgb(220, 53, 69);
        }
      `}</style>
      
      {showEditModal && editingChallenge && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Challenge</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form id="editChallengeForm" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedChallenge = {
                  id: editingChallenge.id,
                  title: formData.get('title'),
                  description: formData.get('description'),
                  exercise_type: formData.get('exercise_type'),
                  goal_type: formData.get('goal_type'),
                  goal_value: parseInt(formData.get('goal_value')),
                  start_date: formData.get('start_date'),
                  end_date: formData.get('end_date'),
                  visibility: currentVisibility
                };
                editChallenge(updatedChallenge);
              }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Title</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    id="title" 
                    name="title" 
                    defaultValue={editingChallenge.title}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="description">Description</label>
                  <textarea 
                    className="form-textarea" 
                    id="description" 
                    name="description" 
                    defaultValue={editingChallenge.description}
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="exercise_type">Exercise Type</label>
                    <select 
                      className="form-select" 
                      id="exercise_type" 
                      name="exercise_type" 
                      defaultValue={editingChallenge.exercise_type}
                      required
                    >
                      <option value="pushups">Pushups</option>
                      <option value="situps">Situps</option>
                      <option value="squats">Squats</option>
                      <option value="pullups">Pullups</option>
                      <option value="lunges">Lunges</option>
                      <option value="burpees">Burpees</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="visibility">Visibility</label>
                    <select 
                      className="form-select" 
                      id="visibility" 
                      name="visibility" 
                      defaultValue={editingChallenge.visibility || 'public'}
                      value={currentVisibility}
                      onChange={(e) => {
                        const newVisibility = e.target.value;
                        // If changing from private to public, show confirmation
                        if (currentVisibility === 'private' && newVisibility === 'public') {
                          if (window.confirm('Changing to a public challenge will delete all invitations. Continue?')) {
                            deleteAllInvites(editingChallenge.id);
                            setCurrentVisibility(newVisibility);
                          } else {
                            // Reset to private if canceled
                            e.target.value = 'private';
                            return;
                          }
                        } else {
                          setCurrentVisibility(newVisibility);
                        }
                      }}
                      required
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="goal_type">Goal Type</label>
                    <select 
                      className="form-select" 
                      id="goal_type" 
                      name="goal_type" 
                      defaultValue={editingChallenge.goal_type}
                      required
                    >
                      <option value="daily_count">Daily Count</option>
                      <option value="total_count">Total Count</option>
                      <option value="streak">Streak Days</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="goal_value">Goal Value</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      id="goal_value" 
                      name="goal_value" 
                      defaultValue={editingChallenge.goal_value}
                      min="1" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="start_date">Start Date</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      id="start_date" 
                      name="start_date" 
                      defaultValue={editingChallenge.start_date}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="end_date">End Date</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      id="end_date" 
                      name="end_date" 
                      defaultValue={editingChallenge.end_date}
                      required 
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Invitations Management Section - Only show for private challenges */}
            {currentVisibility === 'private' && (
              <div className="modal-section">
                <h4 className="section-title">Manage Invitations</h4>
                
                {/* Add new invitation */}
                <div className="invite-form">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email to invite"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => addInvite(editingChallenge.id, newInviteEmail)}
                  >
                    Add Invite
                  </button>
                </div>
                
                {/* List of invitations */}
                <div className="invites-list">
                  <h5>Current Invitations</h5>
                  
                  {loadingInvites ? (
                    <p className="loading-text">Loading invitations...</p>
                  ) : challengeInvites.length > 0 ? (
                    <div className="invites-table">
                      {challengeInvites.map(invite => (
                        <div key={invite.id} className={`invite-item ${invite.status}`}>
                          <div className="invite-email">{invite.email}</div>
                          <div className="invite-status">{invite.status}</div>
                          <div className="invite-actions">
                            <button 
                              className="btn btn-error btn-sm"
                              onClick={() => removeInvite(invite.id, editingChallenge.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">No invitations yet. Add some above.</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                form="editChallengeForm"
                type="submit"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}