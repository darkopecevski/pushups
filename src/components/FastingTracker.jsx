import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FastingTracker = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    goal_hours: 18,
    current_fast: null
  });
  const [fastState, setFastState] = useState({
    isActive: false,
    startTime: null,
    goalTime: null,
    elapsedTime: 0,
    elapsedPercentage: 0
  });
  const [timeDisplay, setTimeDisplay] = useState('00:00:00');
  const [editMode, setEditMode] = useState(null); // 'start' or 'goal'
  const [editDateTime, setEditDateTime] = useState('');

  // Fasting phases information
  const fastingPhases = [
    { name: 'Fed State', hours: 0, color: '#FFD580', icon: '🍎' },
    { name: 'Catabolic', hours: 12, color: '#FF9580', icon: '⚡' },
    { name: 'Ketosis', hours: 16, color: '#F08080', icon: '🔥' },
    { name: 'Deep Ketosis', hours: 24, color: '#E35D5D', icon: '✨' },
    { name: 'Autophagy', hours: 36, color: '#D13030', icon: '♻️' }
  ];

  // Get current fasting phase
  const getCurrentPhase = (hours) => {
    for (let i = fastingPhases.length - 1; i >= 0; i--) {
      if (hours >= fastingPhases[i].hours) {
        return fastingPhases[i];
      }
    }
    return fastingPhases[0];
  };

  // Format time in HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format date nicely
  const formatDate = (date) => {
    if (!date) return '--';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Calculate time difference in seconds
  const calculateTimeDiff = (start, end) => {
    if (!start) return 0;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    return Math.floor((endDate - startDate) / 1000);
  };

  // Load user settings and current fast
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load settings
      let { data: settingsData } = await supabase
        .from('fasting_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If no settings exist, create default settings
      if (!settingsData) {
        const { data: newSettings } = await supabase
          .from('fasting_settings')
          .insert([
            { user_id: userId, goal_hours: 18 }
          ])
          .select()
          .single();
        
        settingsData = newSettings;
      }
      
      // Load current fast (one without an end time)
      const { data: fastData, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      
      console.log("Current fast data:", fastData, error);
      
      // Update settings
      setSettings({
        goal_hours: settingsData.goal_hours,
        current_fast: fastData || null
      });
      
      // If we have an active fast, update the state
      if (fastData) {
        const startTime = new Date(fastData.start_time);
        const goalHours = fastData.goal_hours || settingsData.goal_hours;
        const goalTime = new Date(startTime.getTime() + (goalHours * 60 * 60 * 1000));
        
        const now = new Date();
        const elapsedSecs = calculateTimeDiff(startTime, now);
        const goalSecs = goalHours * 60 * 60;
        const elapsedPercentage = Math.min(100, Math.round((elapsedSecs / goalSecs) * 100));
        
        console.log("Setting active fast state:", {
          startTime,
          goalTime,
          elapsedSecs,
          elapsedPercentage
        });
        
        setFastState({
          isActive: true,
          startTime,
          goalTime,
          elapsedTime: elapsedSecs,
          elapsedPercentage
        });
      } else {
        // Reset state if no active fast
        setFastState({
          isActive: false,
          startTime: null,
          goalTime: null,
          elapsedTime: 0,
          elapsedPercentage: 0
        });
      }
    } catch (error) {
      console.error('Error loading fasting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new fast
  const startFast = async () => {
    try {
      const now = new Date();
      const goalTime = new Date(now.getTime() + (settings.goal_hours * 60 * 60 * 1000));
      
      const { data: newFast, error } = await supabase
        .from('fasting_sessions')
        .insert([
          { 
            user_id: userId, 
            start_time: now.toISOString(),
            goal_hours: settings.goal_hours
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error starting fast:', error);
        return;
      }
      
      console.log("Started new fast:", newFast);
      
      setSettings({
        ...settings,
        current_fast: newFast
      });
      
      setFastState({
        isActive: true,
        startTime: now,
        goalTime,
        elapsedTime: 0,
        elapsedPercentage: 0
      });
    } catch (error) {
      console.error('Error starting fast:', error);
    }
  };

  // End current fast
  const endFast = async () => {
    if (!settings.current_fast || !settings.current_fast.id) {
      console.error("No active fast to end");
      return;
    }
    
    try {
      const now = new Date();
      
      const { error } = await supabase
        .from('fasting_sessions')
        .update({ end_time: now.toISOString() })
        .eq('id', settings.current_fast.id);
      
      if (error) {
        console.error('Error ending fast:', error);
        return;
      }
      
      console.log("Ended fast:", settings.current_fast.id);
      
      setSettings({
        ...settings,
        current_fast: null
      });
      
      setFastState({
        isActive: false,
        startTime: null,
        goalTime: null,
        elapsedTime: 0,
        elapsedPercentage: 0
      });
    } catch (error) {
      console.error('Error ending fast:', error);
    }
  };

  // Update fasting goal
  const updateGoal = async (hours) => {
    try {
      await supabase
        .from('fasting_settings')
        .update({ goal_hours: hours })
        .eq('user_id', userId);
      
      setSettings({
        ...settings,
        goal_hours: hours
      });
      
      // If there's an active fast, update the goal time
      if (fastState.isActive && settings.current_fast) {
        const newGoalTime = new Date(fastState.startTime.getTime() + (hours * 60 * 60 * 1000));
        
        // Update the session with the new goal hours
        await supabase
          .from('fasting_sessions')
          .update({ goal_hours: hours })
          .eq('id', settings.current_fast.id);
        
        setFastState({
          ...fastState,
          goalTime: newGoalTime
        });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.current_fast || !settings.current_fast.id) {
      console.error("No active fast to edit");
      setEditMode(null);
      return;
    }
    
    try {
      const editDate = new Date(editDateTime);
      
      if (editMode === 'start') {
        // Update start time
        const { error } = await supabase
          .from('fasting_sessions')
          .update({ start_time: editDate.toISOString() })
          .eq('id', settings.current_fast.id);
        
        if (error) {
          console.error('Error updating start time:', error);
          return;
        }
        
        const newGoalTime = new Date(editDate.getTime() + (settings.goal_hours * 60 * 60 * 1000));
        
        // Recalculate elapsed time based on the new start time
        const now = new Date();
        const elapsedSecs = calculateTimeDiff(editDate, now);
        const goalSecs = settings.goal_hours * 60 * 60;
        const elapsedPercentage = Math.min(100, Math.round((elapsedSecs / goalSecs) * 100));
        
        setFastState({
          ...fastState,
          startTime: editDate,
          goalTime: newGoalTime,
          elapsedTime: elapsedSecs,
          elapsedPercentage
        });
      } else if (editMode === 'goal') {
        // Calculate new goal hours based on the selected end time
        const newGoalHours = Math.max(0.1, (editDate - fastState.startTime) / (1000 * 60 * 60));
        
        const { error: settingsError } = await supabase
          .from('fasting_settings')
          .update({ goal_hours: newGoalHours })
          .eq('user_id', userId);
        
        if (settingsError) {
          console.error('Error updating settings:', settingsError);
          return;
        }
        
        // Update the session with the new goal hours
        const { error: sessionError } = await supabase
          .from('fasting_sessions')
          .update({ goal_hours: newGoalHours })
          .eq('id', settings.current_fast.id);
        
        if (sessionError) {
          console.error('Error updating session:', sessionError);
          return;
        }
        
        // Recalculate elapsed percentage based on the new goal
        const goalSecs = newGoalHours * 60 * 60;
        const elapsedPercentage = Math.min(100, Math.round((fastState.elapsedTime / goalSecs) * 100));
        
        setSettings({
          ...settings,
          goal_hours: newGoalHours
        });
        
        setFastState({
          ...fastState,
          goalTime: editDate,
          elapsedPercentage
        });
      }
      
      setEditMode(null);
    } catch (error) {
      console.error('Error updating time:', error);
      setEditMode(null);
    }
  };

  // Update timer
  useEffect(() => {
    let interval = null;
    
    if (fastState.isActive && fastState.startTime) {
      // Update the timer immediately
      const now = new Date();
      const startTime = new Date(fastState.startTime);
      const elapsedSecs = Math.floor((now - startTime) / 1000);
      setTimeDisplay(formatTime(elapsedSecs));
      
      // Set up interval for continuous updates
      interval = setInterval(() => {
        const now = new Date();
        const startTime = new Date(fastState.startTime);
        const elapsedSecs = Math.floor((now - startTime) / 1000);
        const goalSecs = settings.goal_hours * 60 * 60;
        const elapsedPercentage = Math.min(100, Math.round((elapsedSecs / goalSecs) * 100));
        
        setFastState(prev => ({
          ...prev,
          elapsedTime: elapsedSecs,
          elapsedPercentage
        }));
        
        setTimeDisplay(formatTime(elapsedSecs));
      }, 1000);
    } else {
      setTimeDisplay('00:00:00');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fastState.isActive, fastState.startTime, settings.goal_hours]);

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Set up edit form when entering edit mode
  useEffect(() => {
    if (editMode === 'start' && fastState.startTime) {
      setEditDateTime(new Date(fastState.startTime).toISOString().slice(0, 16));
    } else if (editMode === 'goal' && fastState.goalTime) {
      setEditDateTime(new Date(fastState.goalTime).toISOString().slice(0, 16));
    }
  }, [editMode, fastState.startTime, fastState.goalTime]);

  // Get current phase
  const elapsedHours = fastState.elapsedTime / 3600;
  const currentPhase = fastState.isActive ? getCurrentPhase(elapsedHours) : null;
  
  if (isLoading) {
    return <div className="loading">Loading fasting tracker...</div>;
  }

  return (
    <div className="fasting-tracker">
      <div className="fasting-ring-container">
        {/* Timer Circle */}
        <svg className="fasting-ring" width="250" height="250" viewBox="0 0 250 250">
          {/* Background Circle */}
          <circle
            className="fasting-ring-bg"
            stroke="#f2f2f2"
            strokeWidth="24"
            fill="transparent"
            r="100"
            cx="125"
            cy="125"
          />
          
          {/* Progress Circle */}
          <circle
            className="fasting-ring-progress"
            stroke={currentPhase?.color || "#FF9580"}
            strokeWidth="24"
            fill="transparent"
            r="100"
            cx="125"
            cy="125"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - fastState.elapsedPercentage / 100)}
            transform="rotate(-90, 125, 125)"
            strokeLinecap="round"
          />
          
          {/* Start Indicator */}
          {fastState.isActive && (
            <circle
              className="fasting-indicator start"
              fill="#FF5A5F"
              r="15"
              cx="125"
              cy="25"
              stroke="#fff"
              strokeWidth="2"
            />
          )}
          
          {/* Phase Indicator */}
          {fastState.isActive && (
            <text
              x="125"
              y="30"
              textAnchor="middle"
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
            >
              {currentPhase?.icon || '🔥'}
            </text>
          )}
          
          {/* Goal Indicator with X mark */}
          {fastState.isActive && (
            <g transform={`rotate(${fastState.elapsedPercentage >= 100 ? 0 : fastState.elapsedPercentage * 3.6}, 125, 125)`}>
              <circle
                className="fasting-indicator goal"
                fill="#fff"
                r="15"
                cx="125"
                cy="25"
                stroke="#FF9580"
                strokeWidth="2"
              />
              <text
                x="125"
                y="30"
                textAnchor="middle"
                fill="#FF9580"
                fontSize="16"
                fontWeight="bold"
              >
                ✕
              </text>
            </g>
          )}
        </svg>
        
        {/* Goal Hour Label */}
        <div className="goal-hour-label">
          {Math.round(settings.goal_hours)}h
        </div>
        
        {/* Center Timer Display */}
        <div className="fasting-timer-display">
          <div className="elapsed-label">
            Elapsed ({fastState.elapsedPercentage}%)
          </div>
          <div className="timer-value">
            {timeDisplay}
          </div>
          {fastState.isActive && currentPhase && (
            <div className="phase-badge">
              <span className="phase-icon">{currentPhase.icon}</span>
              <span className="phase-name">{currentPhase.name.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Time Information */}
      <div className="time-info">
        <div className="time-column">
          <div className="time-label">STARTED</div>
          <div className="time-value">
            {fastState.isActive ? formatDate(fastState.startTime) : '--'}
          </div>
          {fastState.isActive && (
            <button 
              className="edit-time-btn"
              onClick={() => setEditMode('start')}
            >
              Edit Start
            </button>
          )}
        </div>
        
        <div className="time-column">
          <div className="time-label">GOAL</div>
          <div className="time-value">
            {fastState.isActive ? formatDate(fastState.goalTime) : '--'}
          </div>
          {fastState.isActive && (
            <button 
              className="edit-time-btn"
              onClick={() => setEditMode('goal')}
            >
              Edit {Math.round(settings.goal_hours)}h Goal
            </button>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      <button 
        className={`action-btn ${fastState.isActive ? 'end' : 'start'}`}
        onClick={fastState.isActive ? endFast : startFast}
      >
        {fastState.isActive ? 'End Fast' : 'Start Fast'}
      </button>
      
      {/* Edit Form (conditionally rendered) */}
      {editMode && (
        <div className="edit-overlay">
          <form onSubmit={handleEditSubmit} className="edit-form">
            <h3>{editMode === 'start' ? 'Edit Start Time' : 'Edit Goal Time'}</h3>
            <input
              type="datetime-local"
              value={editDateTime}
              onChange={(e) => setEditDateTime(e.target.value)}
              required
            />
            <div className="edit-actions">
              <button type="button" onClick={() => setEditMode(null)}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
      
      <style jsx>{`
        .fasting-tracker {
          background-color: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 24px;
          max-width: 350px;
          margin: 0 auto;
          position: relative;
        }
        
        .fasting-ring-container {
          position: relative;
          width: 250px;
          height: 250px;
          margin: 0 auto 24px;
        }
        
        .fasting-ring {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        
        .fasting-ring-progress {
          transition: stroke-dashoffset 0.5s ease;
        }
        
        .goal-hour-label {
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: rgba(255, 255, 255, 0.9);
          color: #FF9580;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .fasting-timer-display {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 80%;
        }
        
        .elapsed-label {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .timer-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        
        .phase-badge {
          display: inline-flex;
          align-items: center;
          background-color: #f8f8f8;
          border-radius: 16px;
          padding: 6px 12px;
          margin: 0 auto;
        }
        
        .phase-icon {
          margin-right: 4px;
        }
        
        .phase-name {
          font-size: 12px;
          font-weight: bold;
          color: #666;
          letter-spacing: 0.5px;
        }
        
        .time-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 0 12px;
        }
        
        .time-column {
          text-align: center;
          flex: 1;
        }
        
        .time-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        
        .time-value {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        
        .edit-time-btn {
          background: none;
          border: none;
          color: #FF9580;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
        }
        
        .action-btn {
          display: block;
          width: 100%;
          padding: 16px;
          border-radius: 30px;
          border: none;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f8f8f8;
          color: #333;
        }
        
        .action-btn.start {
          background-color: #FF9580;
          color: white;
        }
        
        .action-btn.end {
          background-color: #f8f8f8;
          color: #333;
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .edit-overlay {
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
        
        .edit-form {
          background-color: white;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 350px;
        }
        
        .edit-form h3 {
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .edit-form input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 16px;
        }
        
        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .edit-actions button {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .edit-actions button[type="button"] {
          background-color: #f2f2f2;
          border: 1px solid #ddd;
          color: #666;
        }
        
        .edit-actions button[type="submit"] {
          background-color: #FF9580;
          border: none;
          color: white;
        }
        
        .loading {
          text-align: center;
          padding: 24px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default FastingTracker; 