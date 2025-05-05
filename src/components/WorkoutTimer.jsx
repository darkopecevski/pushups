import { useState, useEffect, useRef } from 'react';

const WorkoutTimer = () => {
  const [timerType, setTimerType] = useState('stopwatch'); // 'stopwatch', 'amrap', 'tabata'
  const [isRunning, setIsRunning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [settings, setSettings] = useState({
    // Common settings
    prepareTime: 5, // 5 seconds
    
    // Stopwatch settings
    timeCap: 60, // 1 minute
    
    // AMRAP settings
    amrapDuration: 60, // 1 minute
    
    // Tabata settings
    workTime: 20, // 20 seconds
    restTime: 10, // 10 seconds
    rounds: 8,
    cycles: 4,
    restBetweenCycles: 0, // seconds
  });
  
  // Timer state
  const [timerState, setTimerState] = useState({
    currentPhase: 'idle', // 'idle', 'prepare', 'work', 'rest', 'restCycle'
    currentTime: 0,
    totalTime: 0,
    currentRound: 1,
    currentCycle: 1,
    phaseEndTime: 0
  });
  
  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [activeSetting, setActiveSetting] = useState(null);
  const [temporaryValue, setTemporaryValue] = useState(0);
  
  const timerRef = useRef(null);
  const beepRef = useRef(null);
  
  const phaseColorMap = {
    idle: '#ccc',
    prepare: '#ffff00', // Yellow
    work: '#00ff00', // Green
    rest: '#ff0000', // Red
    restCycle: '#0000ff', // Blue
    completed: '#808080', // Gray
  };
  
  const timerContainerRef = useRef(null);
  
  // Create audio element for beep sound
  useEffect(() => {
    beepRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3');
    beepRef.current.volume = 0.5;
    
    return () => {
      if (beepRef.current) {
        beepRef.current.pause();
        beepRef.current = null;
      }
    };
  }, []);
  
  // Play beep sound
  const playBeep = () => {
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(e => console.log('Audio play error:', e));
    }
  };
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('workoutTimerSettings', JSON.stringify(settings));
    localStorage.setItem('workoutTimerType', timerType);
  }, [settings, timerType]);
  
  // Load settings from localStorage on initial load
  useEffect(() => {
    const savedSettings = localStorage.getItem('workoutTimerSettings');
    const savedTimerType = localStorage.getItem('workoutTimerType');
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (savedTimerType) {
      setTimerType(savedTimerType);
    }
  }, []);
  
  // Format time to mm:ss or ss format
  const formatTime = (seconds, showMinutes = true) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (showMinutes) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  // Start the timer
  const startTimer = () => {
    // If already running, do nothing
    if (isRunning) return;
    
    // If we were paused, just resume
    if (timerState.currentPhase !== 'idle') {
      // Update the phaseEndTime based on remaining time
      const now = Date.now();
      const newEndTime = now + (timerState.currentTime * 1000);
      
      setTimerState(prev => ({
        ...prev,
        phaseEndTime: newEndTime
      }));
      
      setIsRunning(true);
      return;
    }
    
    // Start new timer
    setIsRunning(true);
    
    // Start with prepare phase if set
    if (settings.prepareTime > 0) {
      setIsPreparing(true);
      
      const now = Date.now();
      const endTime = now + (settings.prepareTime * 1000);
      
      setTimerState({
        ...timerState,
        currentPhase: 'prepare',
        currentTime: settings.prepareTime,
        phaseEndTime: endTime
      });
      
      // Set initial display for prepare phase
      setTimeDisplay(formatTime(settings.prepareTime, false));
    } else {
      startMainTimer();
    }
  };
  
  // Pause the timer
  const pauseTimer = () => {
    if (!isRunning) return;
    
    // Calculate remaining time and store it
    const now = Date.now();
    const { phaseEndTime } = timerState;
    const remaining = Math.max(0, Math.ceil((phaseEndTime - now) / 1000));
    
    // Update the timer state with the current remaining time
    setTimerState(prev => ({
      ...prev,
      currentTime: remaining
    }));
    
    setIsRunning(false);
  };
  
  // Reset the timer
  const resetTimer = () => {
    setIsRunning(false);
    setIsPreparing(false);
    clearInterval(timerRef.current);
    timerRef.current = null;
    
    setTimeDisplay(formatTime(0));
    setProgress(0);
    
    setTimerState({
      currentPhase: 'idle',
      currentTime: 0,
      totalTime: 0,
      currentRound: 1,
      currentCycle: 1,
      phaseEndTime: 0
    });
  };
  
  // Start the main timer after prepare phase
  const startMainTimer = () => {
    setIsPreparing(false);
    
    const now = Date.now();
    
    if (timerType === 'stopwatch') {
      // Start from time cap and count down
      const duration = settings.timeCap;
      const endTime = now + (duration * 1000);
      
      setTimerState({
        ...timerState,
        currentPhase: 'work',
        currentTime: duration,
        totalTime: duration,
        phaseEndTime: endTime
      });
      
      // Initialize time display for main timer
      setTimeDisplay(formatTime(duration));
    } else if (timerType === 'amrap') {
      // Start from duration and count down
      const duration = settings.amrapDuration;
      const endTime = now + (duration * 1000);
      
      setTimerState({
        ...timerState,
        currentPhase: 'work',
        currentTime: duration,
        totalTime: duration,
        phaseEndTime: endTime
      });
      
      // Initialize time display for main timer
      setTimeDisplay(formatTime(duration));
    } else if (timerType === 'tabata') {
      // Start with work phase
      const duration = settings.workTime;
      const endTime = now + (duration * 1000);
      
      setTimerState({
        ...timerState,
        currentPhase: 'work',
        currentTime: duration,
        totalTime: settings.workTime * settings.rounds * settings.cycles,
        // Start rounds and cycles at max value (settings value) and count down
        currentRound: settings.rounds,
        currentCycle: settings.cycles,
        phaseEndTime: endTime
      });
      
      // Initialize time display for Tabata work interval
      setTimeDisplay(formatTime(duration, false));
    }
  };
  
  // Move to next phase in Tabata
  const nextTabataPhase = () => {
    const { currentRound, currentCycle, currentPhase } = timerState;
    const now = Date.now();
    
    // Logic for transitioning between phases
    if (currentPhase === 'work') {
      // After work, go to rest
      const duration = settings.restTime;
      const endTime = now + (duration * 1000);
      
      playBeep(); // Signal phase change
      
      setTimerState(prev => ({
        ...prev,
        currentPhase: 'rest',
        currentTime: duration,
        phaseEndTime: endTime
      }));
      
      // Update display for rest phase
      setTimeDisplay(formatTime(duration, false));
    } else if (currentPhase === 'rest') {
      // After rest, check if round is complete
      if (currentRound <= 1) {
        // Round complete, check if cycle is complete
        if (currentCycle <= 1) {
          // All cycles complete, end workout
          completeWorkout();
          return;
        } else {
          // Move to next cycle with rest between cycles if configured
          if (settings.restBetweenCycles > 0) {
            const duration = settings.restBetweenCycles;
            const endTime = now + (duration * 1000);
            
            playBeep(); // Signal phase change
            
            setTimerState(prev => ({
              ...prev,
              currentPhase: 'restCycle',
              currentTime: duration,
              currentRound: settings.rounds,
              currentCycle: currentCycle - 1,
              phaseEndTime: endTime
            }));
            
            // Update display for cycle rest
            setTimeDisplay(formatTime(duration, false));
          } else {
            // No rest between cycles, start next cycle with work
            const duration = settings.workTime;
            const endTime = now + (duration * 1000);
            
            playBeep(); // Signal phase change
            
            setTimerState(prev => ({
              ...prev,
              currentPhase: 'work',
              currentTime: duration,
              currentRound: settings.rounds,
              currentCycle: currentCycle - 1,
              phaseEndTime: endTime
            }));
            
            // Update display for work phase
            setTimeDisplay(formatTime(duration, false));
          }
        }
      } else {
        // Move to next round with work
        const duration = settings.workTime;
        const endTime = now + (duration * 1000);
        
        playBeep(); // Signal phase change
        
        setTimerState(prev => ({
          ...prev,
          currentPhase: 'work',
          currentTime: duration,
          currentRound: currentRound - 1,
          phaseEndTime: endTime
        }));
        
        // Update display for work phase
        setTimeDisplay(formatTime(duration, false));
      }
    } else if (currentPhase === 'restCycle') {
      // After cycle rest, start next cycle with work
      const duration = settings.workTime;
      const endTime = now + (duration * 1000);
      
      playBeep(); // Signal phase change
      
      setTimerState(prev => ({
        ...prev,
        currentPhase: 'work',
        currentTime: duration,
        phaseEndTime: endTime
      }));
      
      // Update display for work phase
      setTimeDisplay(formatTime(duration, false));
    }
  };
  
  // Complete workout
  const completeWorkout = () => {
    setIsRunning(false);
    playBeep(); // Final beep
    
    setTimerState(prev => ({
      ...prev,
      currentPhase: 'completed',
      currentTime: 0
    }));
    
    setTimeDisplay('00:00');
  };
  
  // Update timer
  const updateTimer = () => {
    if (!isRunning) return;
    
    const now = Date.now();
    const { currentPhase, phaseEndTime } = timerState;
    
    // Calculate remaining time
    const rawRemaining = phaseEndTime - now;
    const remaining = Math.max(0, Math.ceil(rawRemaining / 1000));
    
    // Handle prepare phase
    if (currentPhase === 'prepare') {
      // Play beep on last second
      if (remaining === 1 && rawRemaining <= 1000 && rawRemaining > 900) {
        playBeep();
      }
      
      // Update time display and progress
      setTimeDisplay(formatTime(remaining, false));
      setProgress((1 - remaining / settings.prepareTime) * 100);
      
      // Update timer state
      setTimerState(prev => ({
        ...prev,
        currentTime: remaining
      }));
      
      // Transition to main timer when prepare phase ends
      if (remaining <= 0) {
        playBeep(); // Transition beep
        startMainTimer();
      }
      
      return;
    }
    
    // Handle work phase
    if (currentPhase === 'work' || currentPhase === 'rest' || currentPhase === 'restCycle') {
      // Calculate the appropriate total duration based on phase
      const totalDuration = 
        currentPhase === 'work' ? 
          (timerType === 'stopwatch' ? settings.timeCap : 
           timerType === 'amrap' ? settings.amrapDuration : 
           settings.workTime) : 
        currentPhase === 'rest' ? settings.restTime : 
        settings.restBetweenCycles;
      
      // Play beep on last second
      if (remaining === 1 && rawRemaining <= 1000 && rawRemaining > 900) {
        playBeep();
      }
      
      // Update time display - for tabata always show without minutes
      setTimeDisplay(timerType === 'tabata' ? formatTime(remaining, false) : formatTime(remaining));
      
      // Calculate progress percentage
      const progressPct = (totalDuration - remaining) / totalDuration * 100;
      setProgress(Math.min(100, progressPct));
      
      // Update timer state
      setTimerState(prev => ({
        ...prev,
        currentTime: remaining
      }));
      
      // Handle completion of the current phase
      if (remaining <= 0) {
        if (timerType === 'tabata') {
          // Move to next phase in Tabata sequence
          nextTabataPhase();
        } else {
          // Complete workout for stopwatch and AMRAP
          completeWorkout();
        }
      }
      
      return;
    }
  };
  
  // Run timer updates with a single useEffect hook
  useEffect(() => {
    // Only run if the timer is active
    if (isRunning) {
      // Immediately run an update to get the latest state
      updateTimer();
      
      // Set the interval if it doesn't exist
      if (!timerRef.current) {
        timerRef.current = setInterval(updateTimer, 100);
      }
    } else {
      // Clean up when not running
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Clean up function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timerState.currentPhase, timerState.phaseEndTime]);
  
  // Calculate the current phase color
  const getCurrentPhaseColor = () => {
    const { currentPhase } = timerState;
    
    // Use more vibrant colors as in the screenshot
    const colors = {
      idle: '#333',
      prepare: '#FFC107', // Yellow
      work: '#4CAF50', // Green
      rest: '#FF5722', // Red-Orange
      restCycle: '#2196F3', // Blue
      completed: '#808080', // Gray
    };
    
    // For Tabata, use specific colors based on phase
    if (timerType === 'tabata') {
      if (currentPhase === 'work') return '#4CAF50'; // Green
      if (currentPhase === 'rest') return '#FF5722'; // Red-Orange
    }
    
    return colors[currentPhase] || colors.idle;
  };
  
  // Handle setting changes
  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: parseInt(value, 10)
    });
  };
  
  // Open modal for setting adjustment
  const openSettingModal = (setting) => {
    setActiveSetting(setting);
    setTemporaryValue(settings[setting]);
    setShowModal(true);
  };
  
  // Save setting from modal
  const saveSettingValue = () => {
    if (activeSetting) {
      handleSettingChange(activeSetting, temporaryValue);
    }
    setShowModal(false);
  };
  
  // Handle increment/decrement in modal
  const adjustValue = (amount) => {
    // Different min/max values based on the setting
    let newValue = temporaryValue + amount;
    
    // Apply constraints based on setting type
    if (activeSetting === 'prepareTime') {
      newValue = Math.max(0, Math.min(60, newValue)); // 0-60 seconds
    } else if (activeSetting === 'timeCap' || activeSetting === 'amrapDuration') {
      newValue = Math.max(5, Math.min(3600, newValue)); // 5 seconds - 60 minutes
    } else if (activeSetting === 'workTime' || activeSetting === 'restTime') {
      newValue = Math.max(1, Math.min(300, newValue)); // 1-300 seconds
    } else if (activeSetting === 'rounds' || activeSetting === 'cycles') {
      newValue = Math.max(1, Math.min(99, newValue)); // 1-99 rounds or cycles
    } else if (activeSetting === 'restBetweenCycles') {
      newValue = Math.max(0, Math.min(300, newValue)); // 0-300 seconds
    }
    
    setTemporaryValue(newValue);
  };
  
  // Format value for display in modal
  const formatModalValue = (value, setting) => {
    // For time-based settings, show as mm:ss
    if (['timeCap', 'amrapDuration'].includes(setting)) {
      return formatTime(value);
    } 
    // For second-based settings, show as :ss
    else if (['prepareTime', 'workTime', 'restTime', 'restBetweenCycles'].includes(setting)) {
      return `:${value.toString().padStart(2, '0')}`;
    }
    // For count-based settings, show as number
    else {
      return value.toString();
    }
  };
  
  // Get setting title for modal
  const getSettingTitle = (setting) => {
    const titles = {
      prepareTime: 'Prepare Time',
      timeCap: 'Time Cap',
      amrapDuration: 'AMRAP Duration',
      workTime: 'Work Time',
      restTime: 'Rest Time',
      rounds: 'Rounds',
      cycles: 'Cycles',
      restBetweenCycles: 'Rest Between Cycles'
    };
    return titles[setting] || 'Setting';
  };
  
  // Render settings panel for each timer type
  const renderSettings = () => {
    switch (timerType) {
      case 'stopwatch':
        return (
          <div className="settings-panel">
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Prepare</div>
                <div className="setting-subtitle">Countdown before you start</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('prepareTime')}>
                :{settings.prepareTime.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Time Cap</div>
                <div className="setting-subtitle">Clock will stop at this time</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('timeCap')}>
                {formatTime(settings.timeCap)}
                <span className="setting-arrow">›</span>
              </div>
            </div>
          </div>
        );
        
      case 'amrap':
        return (
          <div className="settings-panel">
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Prepare</div>
                <div className="setting-subtitle">Countdown before you start</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('prepareTime')}>
                :{settings.prepareTime.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Start Time</div>
                <div className="setting-subtitle">Total duration of workout</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('amrapDuration')}>
                {formatTime(settings.amrapDuration)}
                <span className="setting-arrow">›</span>
              </div>
            </div>
          </div>
        );
        
      case 'tabata':
        return (
          <div className="settings-panel">
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Prepare</div>
                <div className="setting-subtitle">Countdown before you start</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('prepareTime')}>
                :{settings.prepareTime.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Work</div>
                <div className="setting-subtitle">Do exercise for this long</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('workTime')}>
                :{settings.workTime.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Rest</div>
                <div className="setting-subtitle">Rest for this long</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('restTime')}>
                :{settings.restTime.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Rounds</div>
                <div className="setting-subtitle">One Round is Work + Rest</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('rounds')}>
                {settings.rounds}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Cycles</div>
                <div className="setting-subtitle">One Cycle is {settings.rounds} Rounds</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('cycles')}>
                {settings.cycles}
                <span className="setting-arrow">›</span>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-label">
                <div className="setting-title">Rest Between Cycles</div>
                <div className="setting-subtitle">Recovery Interval</div>
              </div>
              <div className="setting-value" onClick={() => openSettingModal('restBetweenCycles')}>
                :{settings.restBetweenCycles.toString().padStart(2, '0')}
                <span className="setting-arrow">›</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render the timer display when running
  const renderTimerDisplay = () => {
    const { currentPhase, currentRound, currentCycle } = timerState;
    
    if (!isRunning && currentPhase === 'idle' && !showSettings) {
      return (
        <div className="empty-timer-display">
          <div className="empty-timer-message">Press Go to start</div>
        </div>
      );
    }
    
    // Only show Tabata indicators after prepare phase or when settings are shown
    const showTabataIndicators = timerType === 'tabata' && 
      (currentPhase !== 'prepare' || (currentPhase === 'idle' && !isRunning));
    
    // Get the current phase color
    const phaseColor = getCurrentPhaseColor();
    
    // Determine rounds and cycles to display
    const roundsToShow = currentPhase === 'idle' ? settings.rounds : currentRound;
    const cyclesToShow = currentPhase === 'idle' ? settings.cycles : currentCycle;
    
    return (
      <div className="timer-display">
        {isFullscreen && (
          <button className="exit-fullscreen-btn" onClick={toggleFullscreen}>
            ✕
          </button>
        )}
        <div className="timer-circle">
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Background Circle */}
            <circle
              className="timer-circle-bg"
              stroke="#333"
              strokeWidth="24"
              fill="transparent"
              r="130"
              cx="150"
              cy="150"
            />
            
            {/* Progress Circle */}
            <circle
              className="timer-circle-progress"
              stroke={phaseColor}
              strokeWidth="24"
              fill="transparent"
              r="130"
              cx="150"
              cy="150"
              strokeDasharray={2 * Math.PI * 130}
              strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
              transform="rotate(-90, 150, 150)"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="timer-content">
            <div className="timer-phase" style={{ color: phaseColor }}>
              {currentPhase === 'prepare' ? 'PREPARE' : 
               currentPhase === 'work' ? 'WORK' : 
               currentPhase === 'rest' ? 'REST' : 
               currentPhase === 'restCycle' ? 'CYCLE REST' : 
               currentPhase === 'completed' ? 'COMPLETE' : ''}
            </div>
            <div className="timer-time" style={{ color: phaseColor }}>
              {timeDisplay}
            </div>
            <div className="timer-controls">
              <button className="timer-btn" onClick={isRunning ? pauseTimer : startTimer}>
                {isRunning ? '⏸' : '▶'}
              </button>
              <button className="timer-btn" onClick={resetTimer}>
                ↻
              </button>
            </div>
          </div>
          
          {/* Show rounds and cycles for Tabata */}
          {showTabataIndicators && (
            <div className="tabata-indicators">
              <div className="tabata-indicator">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle
                    className="indicator-bg"
                    stroke="#333"
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    stroke="#4F96FF" /* Blue */
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={(2 * Math.PI * 42) * (1 - roundsToShow / settings.rounds)}
                    transform="rotate(-90, 50, 50)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="indicator-content">
                  <div className="indicator-value">{roundsToShow}</div>
                  <div className="indicator-label">ROUNDS</div>
                </div>
              </div>
              
              <div className="tabata-indicator">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle
                    className="indicator-bg"
                    stroke="#333"
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    stroke="#4FD2C7" /* Teal */
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={(2 * Math.PI * 42) * (1 - cyclesToShow / settings.cycles)}
                    transform="rotate(-90, 50, 50)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="indicator-content">
                  <div className="indicator-value">{cyclesToShow}</div>
                  <div className="indicator-label">CYCLES</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render the timer type tabs at the bottom
  const renderTimerTypeTabs = () => {
    return (
      <div className="timer-tabs">
        <button 
          className={`timer-tab ${timerType === 'stopwatch' ? 'active' : ''}`}
          onClick={() => {
            setTimerType('stopwatch');
            // Hide settings when switching timer types
            setShowSettings(false);
          }}
        >
          <div className="tab-icon">⏱</div>
          <div className="tab-name">Stopwatch</div>
        </button>
        <button 
          className={`timer-tab ${timerType === 'amrap' ? 'active' : ''}`}
          onClick={() => {
            setTimerType('amrap');
            // Hide settings when switching timer types
            setShowSettings(false);
          }}
        >
          <div className="tab-icon">⟳</div>
          <div className="tab-name">AMRAP</div>
        </button>
        <button 
          className={`timer-tab ${timerType === 'tabata' ? 'active' : ''}`}
          onClick={() => {
            setTimerType('tabata');
            // Hide settings when switching timer types
            setShowSettings(false);
          }}
        >
          <div className="tab-icon">◯</div>
          <div className="tab-name">Tabata</div>
        </button>
      </div>
    );
  };
  
  // Render setting adjustment modal
  const renderSettingModal = () => {
    if (!showModal || !activeSetting) return null;
    
    return (
      <div className="setting-modal-overlay">
        <div className="setting-modal">
          <div className="setting-modal-header">
            <h3>{getSettingTitle(activeSetting)}</h3>
          </div>
          
          <div className="setting-modal-content">
            <div className="setting-value-display">
              {formatModalValue(temporaryValue, activeSetting)}
            </div>
            
            <div className="setting-value-controls">
              <button 
                className="value-adjust-btn"
                onClick={() => adjustValue(-5)}
              >
                -5
              </button>
              <button 
                className="value-adjust-btn"
                onClick={() => adjustValue(-1)}
              >
                -1
              </button>
              <button 
                className="value-adjust-btn"
                onClick={() => adjustValue(1)}
              >
                +1
              </button>
              <button 
                className="value-adjust-btn"
                onClick={() => adjustValue(5)}
              >
                +5
              </button>
            </div>
          </div>
          
          <div className="setting-modal-footer">
            <button 
              className="setting-modal-btn cancel"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button 
              className="setting-modal-btn save"
              onClick={saveSettingValue}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Toggle settings visibility
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (timerContainerRef.current.requestFullscreen) {
        timerContainerRef.current.requestFullscreen();
      } else if (timerContainerRef.current.webkitRequestFullscreen) {
        timerContainerRef.current.webkitRequestFullscreen();
      } else if (timerContainerRef.current.msRequestFullscreen) {
        timerContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <div className={`workout-timer ${isFullscreen ? 'fullscreen' : ''}`} ref={timerContainerRef}>
      <div className="timer-header">
        <h2 className="timer-title">{timerType === 'stopwatch' ? 'Stopwatch' : timerType === 'amrap' ? 'AMRAP' : 'Tabata'}</h2>
        <div className="header-controls">
          <button className="fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '↙' : '↗'}
          </button>
          <button className={`settings-btn ${showSettings ? 'active' : ''}`} onClick={toggleSettings}>
            ⚙️
          </button>
          <button className="start-btn" onClick={startTimer}>Go 🏃</button>
        </div>
      </div>
      
      <div className="timer-container">
        {!isRunning && showSettings ? renderSettings() : null}
        {!showSettings || isRunning ? renderTimerDisplay() : null}
      </div>
      
      {renderTimerTypeTabs()}
      {renderSettingModal()}
      
      <style>{`
        .workout-timer {
          position: relative;
          background-color: #000;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          padding: 0;
          overflow: hidden;
          max-width: 400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        
        .workout-timer.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          width: 100%;
          max-width: none;
          height: 100vh;
          border-radius: 0;
        }
        
        .fullscreen-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .fullscreen-btn:hover {
          opacity: 1;
        }
        
        .exit-fullscreen-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: #fff;
          font-size: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .exit-fullscreen-btn:hover {
          opacity: 1;
        }
        
        .timer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
          background-color: #000;
        }
        
        .timer-title {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          color: #fff;
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .settings-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
          color: #fff;
        }
        
        .settings-btn:hover {
          opacity: 1;
        }
        
        .settings-btn.active {
          opacity: 1;
          color: #4CAF50;
        }
        
        .start-btn {
          background: none;
          border: none;
          color: #4CAF50;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .timer-container {
          flex: 1;
          min-height: 550px;
          display: flex;
          flex-direction: column;
          background-color: #000;
        }
        
        .settings-panel {
          padding: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #000;
          color: #fff;
        }
        
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        }
        
        .setting-title {
          font-size: 18px;
          font-weight: 500;
          color: #fff;
        }
        
        .setting-subtitle {
          font-size: 14px;
          color: #999;
        }
        
        .setting-value {
          font-size: 30px;
          font-weight: 500;
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #fff;
        }
        
        .empty-timer-display {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 550px;
          background-color: #000;
        }
        
        .empty-timer-message {
          color: #999;
          font-size: 20px;
          font-weight: 500;
        }
        
        .timer-display {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
          background-color: #000;
          position: relative;
          min-height: 550px;
        }
        
        .timer-circle {
          position: relative;
          width: 300px;
          height: 300px;
        }
        
        .timer-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 100%;
        }
        
        .timer-phase {
          color: ${getCurrentPhaseColor()};
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .timer-time {
          color: ${getCurrentPhaseColor()};
          font-size: 80px;
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1;
        }
        
        .timer-controls {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        
        .timer-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          border: 2px solid #fff;
          color: #fff;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .tabata-indicators {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-evenly;
          padding-top: 20px;
        }
        
        .tabata-indicator {
          position: relative;
          width: 100px;
          height: 100px;
        }
        
        .indicator-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .indicator-value {
          font-size: 40px;
          font-weight: 700;
          color: white;
          text-align: center;
          line-height: 1;
        }
        
        .indicator-label {
          font-size: 12px;
          color: #999;
          text-align: center;
          text-transform: uppercase;
          margin-top: 5px;
        }
        
        .timer-circle-progress {
          transition: stroke-dashoffset 0.3s linear;
        }
        
        .timer-tabs {
          display: flex;
          justify-content: space-around;
          border-top: 1px solid #333;
          background-color: #000;
          padding: 8px 0;
        }
        
        .timer-tab {
          flex: 1;
          padding: 12px 0;
          background: none;
          border: none;
          text-align: center;
          cursor: pointer;
          color: #999;
          transition: color 0.2s;
        }
        
        .timer-tab:hover {
          color: #ccc;
        }
        
        .timer-tab.active {
          color: #4CAF50;
        }
        
        .tab-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .tab-name {
          font-size: 12px;
        }
        
        .setting-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .setting-modal {
          background-color: #222;
          border-radius: 12px;
          width: 90%;
          max-width: 350px;
          overflow: hidden;
          color: #fff;
        }
        
        .setting-modal-header {
          padding: 16px;
          text-align: center;
          border-bottom: 1px solid #333;
        }
        
        .setting-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }
        
        .setting-modal-content {
          padding: 24px 16px;
        }
        
        .setting-value-display {
          font-size: 48px;
          text-align: center;
          margin-bottom: 24px;
          color: #fff;
        }
        
        .setting-value-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .value-adjust-btn {
          padding: 12px;
          background-color: #333;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          color: #fff;
        }
        
        .setting-modal-footer {
          display: flex;
          border-top: 1px solid #333;
        }
        
        .setting-modal-btn {
          flex: 1;
          padding: 16px;
          border: none;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          background: none;
        }
        
        .setting-modal-btn.cancel {
          border-right: 1px solid #333;
          color: #999;
        }
        
        .setting-modal-btn.save {
          color: #4CAF50;
        }
        
        /* Additional fullscreen styles */
        .fullscreen .timer-display {
          padding-top: 60px;
        }
        
        .fullscreen .timer-circle {
          transform: scale(1.5);
        }
        
        .fullscreen .tabata-indicators {
          transform: scale(1.3);
          padding-top: 40px;
        }
      `}</style>
    </div>
  );
};

export default WorkoutTimer; 