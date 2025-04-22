import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const WaterIntakeTracker = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({ daily_goal: 2000, unit_preference: 'ml' });
  const [intake, setIntake] = useState({ current: 0, percentage: 0, remaining: 0 });
  const [customAmount, setCustomAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [presets, setPresets] = useState([]);
  const [newPreset, setNewPreset] = useState({ amount: '' });
  const [showAddPreset, setShowAddPreset] = useState(false);
  
  // Unit conversion functions
  const mlToOz = (ml) => parseFloat((ml / 29.574).toFixed(1));
  const ozToMl = (oz) => Math.round(oz * 29.574);
  
  // Format value based on unit preference
  const formatValue = (value) => {
    if (settings.unit_preference === 'oz') {
      return `${mlToOz(value)}oz`;
    }
    return `${value}ml`;
  };
  
  // Get displayed value based on unit preference
  const getDisplayValue = (value) => {
    return settings.unit_preference === 'oz' ? mlToOz(value) : value;
  };
  
  // Load user settings and water intake data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load settings
      let { data: settingsData } = await supabase
        .from('water_intake_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If no settings exist, create default settings
      if (!settingsData) {
        const { data: newSettings } = await supabase
          .from('water_intake_settings')
          .insert([
            { user_id: userId, daily_goal: 2000, unit_preference: 'ml' }
          ])
          .select()
          .single();
        
        settingsData = newSettings;
      }
      
      // Format date as YYYY-MM-DD for database query
      const dateStr = date.toISOString().split('T')[0];
      
      // Load water intake logs for the selected date
      const { data: logData } = await supabase
        .from('water_intake_logs')
        .select('amount')
        .eq('user_id', userId)
        .eq('log_date', dateStr);
      
      // Calculate total intake
      const totalIntake = logData?.reduce((sum, log) => sum + log.amount, 0) || 0;
      const percentage = Math.min(100, Math.round((totalIntake / settingsData.daily_goal) * 100));
      const remaining = settingsData.daily_goal - totalIntake;
      
      setSettings(settingsData);
      setIntake({ 
        current: totalIntake, 
        percentage, 
        remaining
      });
      
      // Load presets
      const { data: presetData } = await supabase
        .from('water_intake_presets')
        .select('*')
        .eq('user_id', userId)
        .eq('beverage_type', 'water')
        .order('display_order', { ascending: true });
      
      // If no presets, create default ones
      if (!presetData || presetData.length === 0) {
        const defaultPresets = [
          { user_id: userId, amount: 250, beverage_type: 'water', display_order: 0 },
          { user_id: userId, amount: 500, beverage_type: 'water', display_order: 1 },
          { user_id: userId, amount: 750, beverage_type: 'water', display_order: 2 },
        ];
        
        const { data: newPresets } = await supabase
          .from('water_intake_presets')
          .insert(defaultPresets)
          .select();
        
        setPresets(newPresets || []);
      } else {
        setPresets(presetData);
      }
    } catch (error) {
      console.error('Error loading water intake data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Log water intake
  const logIntake = async (amount) => {
    try {
      // Format date as YYYY-MM-DD for database
      const dateStr = date.toISOString().split('T')[0];
      
      // Add log entry
      await supabase.from('water_intake_logs').insert([
        { 
          user_id: userId, 
          amount,
          beverage_type: 'water', 
          log_date: dateStr
        }
      ]);
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error logging water intake:', error);
    }
  };
  
  // Handle custom amount submission
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const amount = settings.unit_preference === 'oz' 
      ? ozToMl(parseFloat(customAmount)) 
      : parseInt(customAmount, 10);
    
    if (amount > 0) {
      logIntake(amount);
      setCustomAmount('');
    }
  };
  
  // Toggle unit preference
  const toggleUnitPreference = async () => {
    const newPreference = settings.unit_preference === 'ml' ? 'oz' : 'ml';
    
    try {
      await supabase
        .from('water_intake_settings')
        .update({ unit_preference: newPreference })
        .eq('user_id', userId);
      
      setSettings({ ...settings, unit_preference: newPreference });
    } catch (error) {
      console.error('Error updating unit preference:', error);
    }
  };
  
  // Update daily goal
  const updateDailyGoal = async (e) => {
    const newGoal = settings.unit_preference === 'oz' 
      ? ozToMl(parseFloat(e.target.value)) 
      : parseInt(e.target.value, 10);
    
    if (newGoal > 0) {
      try {
        await supabase
          .from('water_intake_settings')
          .update({ daily_goal: newGoal })
          .eq('user_id', userId);
        
        setSettings({ ...settings, daily_goal: newGoal });
        loadData(); // Refresh to update percentages
      } catch (error) {
        console.error('Error updating daily goal:', error);
      }
    }
  };
  
  // Add new preset
  const addPreset = async (e) => {
    e.preventDefault();
    
    const amount = settings.unit_preference === 'oz' 
      ? ozToMl(parseFloat(newPreset.amount)) 
      : parseInt(newPreset.amount, 10);
    
    if (amount > 0) {
      try {
        const displayOrder = presets.length;
        
        await supabase.from('water_intake_presets').insert([
          { 
            user_id: userId, 
            amount, 
            beverage_type: 'water',
            display_order: displayOrder
          }
        ]);
        
        setNewPreset({ amount: '' });
        setShowAddPreset(false);
        loadData(); // Refresh to show new preset
      } catch (error) {
        console.error('Error adding preset:', error);
      }
    }
  };
  
  // Navigate to previous/next day
  const changeDate = (increment) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + increment);
    setDate(newDate);
  };
  
  // Load data on mount and when date changes
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, date]);
  
  if (isLoading) {
    return <div className="loading">Loading water intake data...</div>;
  }
  
  return (
    <div className="water-intake-tracker">
      <div className="tracker-header">
        <div className="unit-toggle">
          <button 
            className={`unit-btn ${settings.unit_preference === 'ml' ? 'active' : ''}`}
            onClick={toggleUnitPreference}
          >
            ml
          </button>
          <button 
            className={`unit-btn ${settings.unit_preference === 'oz' ? 'active' : ''}`}
            onClick={toggleUnitPreference}
          >
            oz
          </button>
        </div>
        
        <div className="date-navigator">
          <button onClick={() => changeDate(-1)} className="nav-btn">
            &larr;
          </button>
          <span>{date.toLocaleDateString()}</span>
          <button onClick={() => changeDate(1)} className="nav-btn">
            &rarr;
          </button>
        </div>
      </div>
      
      <div className="tracker-body">
        <div className="hydration-display">
          <div className="progress-ring-container">
            <svg className="progress-ring" width="150" height="150">
              <circle
                className="progress-ring-circle-bg"
                stroke="#e6f4ff"
                strokeWidth="10"
                fill="transparent"
                r="60"
                cx="75"
                cy="75"
              />
              <circle
                className="progress-ring-circle"
                stroke="#3498db"
                strokeWidth="10"
                fill="transparent"
                r="60"
                cx="75"
                cy="75"
                style={{ 
                  strokeDasharray: `${2 * Math.PI * 60}`,
                  strokeDashoffset: `${2 * Math.PI * 60 * (1 - intake.percentage / 100)}`
                }}
              />
            </svg>
            
            <div className="progress-text">
              <div className="percentage">{intake.percentage}%</div>
              <div className="current-amount">{formatValue(intake.current)}</div>
              <div className="remaining-amount">
                {intake.remaining > 0 
                  ? `-${formatValue(intake.remaining)}` 
                  : `+${formatValue(Math.abs(intake.remaining))}`}
              </div>
            </div>
          </div>
          
          <div className="daily-goal-container">
            <label htmlFor="daily-goal">Goal:</label>
            <input
              id="daily-goal"
              type="number"
              value={getDisplayValue(settings.daily_goal)}
              onChange={updateDailyGoal}
              min="1"
              className="daily-goal-input"
            />
            <span className="unit">{settings.unit_preference}</span>
          </div>
        </div>
        
        <div className="quick-add-container">
          <div className="presets-grid">
            {presets.map(preset => (
              <button
                key={preset.id}
                className="preset-btn"
                onClick={() => logIntake(preset.amount)}
              >
                {formatValue(preset.amount)}
              </button>
            ))}
            
            <form onSubmit={handleCustomSubmit} className="manual-add-form">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`Add (${settings.unit_preference})`}
                min="1"
                className="custom-amount-input"
              />
              <button type="submit" className="add-btn">+</button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .water-intake-tracker {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .unit-toggle {
          display: flex;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .unit-btn {
          background: none;
          border: none;
          padding: 0.2rem 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .unit-btn.active {
          background-color: #3498db;
          color: white;
        }
        
        .date-navigator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 14px;
        }
        
        .nav-btn {
          background: none;
          border: 1px solid #e0e0e0;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
          font-size: 12px;
        }
        
        .nav-btn:hover {
          background-color: #f0f0f0;
        }
        
        .tracker-body {
          padding: 1rem;
        }
        
        .hydration-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .progress-ring-container {
          position: relative;
          width: 150px;
          height: 150px;
          margin-bottom: 1rem;
        }
        
        .progress-ring-circle {
          transition: stroke-dashoffset 0.5s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 100%;
        }
        
        .percentage {
          font-size: 1.75rem;
          font-weight: 700;
          color: #3498db;
          line-height: 1;
        }
        
        .current-amount {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.2;
        }
        
        .remaining-amount {
          font-size: 0.85rem;
          color: #666;
        }
        
        .daily-goal-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .daily-goal-input {
          width: 60px;
          padding: 0.2rem 0.4rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
        }
        
        .unit {
          font-size: 14px;
          color: #666;
        }
        
        .presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        
        .preset-btn {
          background-color: #e3f2fd;
          color: #1976d2;
          border: none;
          border-radius: 6px;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 0.85rem;
        }
        
        .preset-btn:hover {
          background-color: #bbdefb;
        }
        
        .manual-add-form {
          grid-column: span 3;
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .custom-amount-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        
        .add-btn {
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          width: 40px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .add-btn:hover {
          background-color: #2980b9;
        }
        
        .loading {
          padding: 1rem;
          text-align: center;
          color: #666;
          font-size: 0.85rem;
        }
        
        @media (max-width: 768px) {
          .water-intake-tracker {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default WaterIntakeTracker; 