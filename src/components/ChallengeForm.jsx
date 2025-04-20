// src/components/ChallengeForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChallengeForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState('pushups');
  const [goalType, setGoalType] = useState('daily_count');
  const [goalValue, setGoalValue] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [inviteEmails, setInviteEmails] = useState('');
  const [emailError, setEmailError] = useState(null);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        if (user) {
          // Get user profile to check admin status
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          setIsAdmin(data?.is_admin || false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdmin();
  }, []);
  
  // Set default dates
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDateDefault = new Date(today);
    endDateDefault.setDate(endDateDefault.getDate() + 30);
    
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(endDateDefault.toISOString().split('T')[0]);
  }, []);
  
  const resetForm = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDateDefault = new Date(today);
    endDateDefault.setDate(endDateDefault.getDate() + 30);
    
    setTitle('');
    setDescription('');
    setExerciseType('pushups');
    setGoalType('daily_count');
    setGoalValue(50);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(endDateDefault.toISOString().split('T')[0]);
    setVisibility('public');
    setInviteEmails('');
    setEmailError(null);
    setFormError(null);
  };
  
  const validateEmails = (emails) => {
    if (!emails.trim() && visibility === 'private') {
      setEmailError('You must invite at least one person to a private challenge');
      return false;
    }
    
    const emailList = emails.split(/[,\s]+/).filter(email => email.trim() !== '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setEmailError(`Invalid email format: ${invalidEmails.join(', ')}`);
      return false;
    }
    
    setEmailError(null);
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setFormError('Only administrators can create challenges.');
      return;
    }
    
    // Validate emails if private challenge
    if (visibility === 'private') {
      if (!validateEmails(inviteEmails)) {
        return;
      }
    }
    
    setLoading(true);
    setFormError(null);
    setFormSuccess(false);
    
    try {
      // Insert the challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert([
          {
            title,
            description,
            exercise_type: exerciseType,
            goal_type: goalType,
            goal_value: parseInt(goalValue),
            start_date: startDate,
            end_date: endDate,
            created_by: currentUser?.id,
            visibility
          }
        ])
        .select();
        
      if (challengeError) throw challengeError;
      
      // If private challenge, add invitations
      if (visibility === 'private' && inviteEmails.trim() !== '') {
        const emailList = inviteEmails.split(/[,\s]+/).filter(email => email.trim() !== '');
        
        // Prepare invite records
        const inviteRecords = emailList.map(email => ({
          challenge_id: challengeData[0].id,
          email: email.trim().toLowerCase(),
          status: 'pending'
        }));
        
        // Insert invites
        const { error: inviteError } = await supabase
          .from('challenge_invites')
          .insert(inviteRecords);
          
        if (inviteError) throw inviteError;
      }
      
      // Reset form and show success
      resetForm();
      setFormSuccess(true);
      
      // Close form after delay
      setTimeout(() => {
        setIsFormOpen(false);
        setFormSuccess(false);
      }, 3000);
      
      // Notify parent component
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Error creating challenge:', err);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="challenge-form-container">
      {!isFormOpen ? (
        <button 
          onClick={() => setIsFormOpen(true)} 
          className="btn btn-primary add-challenge-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create New Challenge</span>
        </button>
      ) : (
        <div className="challenge-form-card">
          <div className="form-header">
            <h3>Create New Challenge</h3>
            <button onClick={() => setIsFormOpen(false)} className="close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-body">
              <div className="form-group">
                <label htmlFor="title" className="form-label">Challenge Title</label>
                <input
                  id="title"
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your challenge"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the challenge (optional)"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="exerciseType" className="form-label">Exercise Type</label>
                  <select
                    id="exerciseType"
                    className="form-control"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                  >
                    <option value="pushups">Push-ups</option>
                    <option value="situps">Sit-ups</option>
                    <option value="squats">Squats</option>
                    <option value="pullups">Pull-ups</option>
                    <option value="planks">Planks</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="goalType" className="form-label">Goal Type</label>
                  <select
                    id="goalType"
                    className="form-control"
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                  >
                    <option value="daily_count">Daily Count</option>
                    <option value="total_count">Total Count</option>
                    <option value="streak">Streak Days</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="goalValue" className="form-label">Goal Target</label>
                  <input
                    id="goalValue"
                    type="number"
                    className="form-control"
                    min="1"
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate" className="form-label">Start Date</label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate" className="form-label">End Date</label>
                  <input
                    id="endDate"
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <div className="visibility-options">
                  <label className="visibility-option">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                    />
                    <span className="option-label">Public</span>
                    <span className="option-description">
                      Anyone can see and join this challenge
                    </span>
                  </label>
                  
                  <label className="visibility-option">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                    />
                    <span className="option-label">Private</span>
                    <span className="option-description">
                      Only invited users can see and join this challenge
                    </span>
                  </label>
                </div>
              </div>
              
              {visibility === 'private' && (
                <div className="form-group">
                  <label htmlFor="inviteEmails" className="form-label">
                    Invite Participants (comma or space separated emails)
                  </label>
                  <textarea
                    id="inviteEmails"
                    className={`form-control ${emailError ? 'error' : ''}`}
                    value={inviteEmails}
                    onChange={(e) => {
                      setInviteEmails(e.target.value);
                      if (emailError) validateEmails(e.target.value);
                    }}
                    placeholder="email@example.com, another@example.com"
                    rows={2}
                  />
                  {emailError && (
                    <div className="form-error">{emailError}</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-footer">
              {formError && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{formError}</span>
                </div>
              )}
              
              {formSuccess && (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Challenge created successfully!</span>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <style>{`
        .challenge-form-container {
          margin-bottom: var(--spacing-xl);
        }
        
        .add-challenge-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          justify-content: center;
          padding: var(--spacing-md);
        }
        
        .challenge-form-card {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }
        
        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .form-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .close-btn {
          background: transparent;
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        
        .close-btn:hover {
          color: var(--color-text);
        }
        
        .form-body {
          padding: var(--spacing-md);
        }
        
        .form-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
        }
        
        .visibility-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-top: var(--spacing-xs);
        }
        
        .visibility-option {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .visibility-option:hover {
          background-color: var(--color-background);
        }
        
        .visibility-option input {
          margin-top: 0.2rem;
        }
        
        .visibility-option input:checked + .option-label {
          font-weight: 600;
          color: var(--color-primary);
        }
        
        .option-label {
          font-weight: 500;
          margin-right: var(--spacing-sm);
        }
        
        .option-description {
          color: var(--color-text-light);
          font-size: 0.875rem;
        }
        
        .form-error {
          color: var(--color-error);
          font-size: 0.875rem;
          margin-top: var(--spacing-xs);
        }
        
        .form-control.error {
          border-color: var(--color-error);
        }
        
        @media (max-width: 576px) {
          .form-actions {
            flex-direction: column;
          }
          
          .form-actions button {
            width: 100%;
          }
          
          .visibility-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}