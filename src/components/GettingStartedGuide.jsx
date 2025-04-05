// src/components/GettingStartedGuide.jsx
import { useState } from 'react';

export default function GettingStartedGuide() {
  const [expandedStep, setExpandedStep] = useState(null);
  
  const steps = [
    {
      id: 1,
      title: 'Find a Challenge',
      description: 'Browse available challenges and join one that matches your fitness goals. You can participate in multiple challenges at the same time.',
      icon: '🔍',
      link: '/challenges',
      linkText: 'Browse Challenges'
    },
    {
      id: 2,
      title: 'Log Your Exercises',
      description: 'Track your daily exercises for each challenge you\'ve joined. Use the +/- buttons to adjust your count and save your progress.',
      icon: '📝',
      link: '/',
      linkText: 'Go to Dashboard'
    },
    {
      id: 3,
      title: 'Check the Leaderboard',
      description: 'See how you stack up against other participants. The leaderboard shows top performers for different time periods.',
      icon: '🏆',
      link: '/leaderboard',
      linkText: 'View Leaderboard'
    },
    {
      id: 4,
      title: 'Maintain Your Streak',
      description: 'Try to exercise consistently to build a streak. Your weekly activity is tracked to help you stay motivated.',
      icon: '🔥',
      link: null,
      linkText: null
    }
  ];
  
  const toggleStep = (stepId) => {
    if (expandedStep === stepId) {
      setExpandedStep(null);
    } else {
      setExpandedStep(stepId);
    }
  };
  
  return (
    <div className="getting-started-guide">
      <h3>Getting Started</h3>
      
      <div className="steps-list">
        {steps.map(step => (
          <div key={step.id} className={`step-item ${expandedStep === step.id ? 'expanded' : ''}`}>
            <div className="step-header" onClick={() => toggleStep(step.id)}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">
                <h4>{step.title}</h4>
              </div>
              <div className="expand-icon">
                {expandedStep === step.id ? '−' : '+'}
              </div>
            </div>
            
            {expandedStep === step.id && (
              <div className="step-content">
                <p>{step.description}</p>
                {step.link && (
                  <a href={step.link} className="step-link">{step.linkText}</a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .getting-started-guide {
          padding: 1.5rem;
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 1.25rem;
          color: #4f46e5;
        }
        
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .step-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .step-item.expanded {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .step-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          background-color: #f9fafb;
        }
        
        .step-icon {
          font-size: 1.25rem;
          margin-right: 1rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e5e7eb;
          border-radius: 50%;
        }
        
        .step-title {
          flex: 1;
        }
        
        .step-title h4 {
          margin: 0;
          font-size: 1rem;
          color: #1f2937;
        }
        
        .expand-icon {
          font-size: 1.25rem;
          color: #6b7280;
          font-weight: bold;
        }
        
        .step-content {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          background-color: white;
        }
        
        .step-content p {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #4b5563;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .step-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .step-link:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
}