// src/components/ChallengeForm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChallengeForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formError, setFormError] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState('pushups');
  const [goalType, setGoalType] = useState('daily_count');
  const [goalValue, setGoalValue] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setFormError('Only administrators can create challenges.');
      return;
    }
    
    setLoading(true);
    setFormError(null);
    
    try {
      const { data, error } = await supabase
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
            created_by: currentUser?.id
          }
        ]);
        
      if (error) throw error;
      
      // Reset form
      setTitle('');
      setDescription('');
      setExerciseType('pushups');
      setGoalType('daily_count');
      setGoalValue(50);
      
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
    return null; // Don't render form for non-admins
  }
  
  return (
    <div className="challenge-form">
      <h2>Create New Challenge</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Challenge Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="exerciseType">Exercise Type</label>
            <select
              id="exerciseType"
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
            <label htmlFor="goalType">Goal Type</label>
            <select
              id="goalType"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
            >
              <option value="daily_count">Daily Count</option>
              <option value="total_count">Total Count</option>
              <option value="streak">Streak Days</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="goalValue">Goal Target</label>
            <input
              id="goalValue"
              type="number"
              min="1"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>
        
        {formError && <div className="error">{formError}</div>}
        
        <button type="submit" disabled={loading} className="create-btn">
          {loading ? 'Creating...' : 'Create Challenge'}
        </button>
      </form>
    </div>
  );
}