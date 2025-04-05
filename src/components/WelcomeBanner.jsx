// src/components/WelcomeBanner.jsx
import { useState } from 'react';

export default function WelcomeBanner({ username }) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.9 8.4l-8.4 8.4-4.4-4.4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div className="welcome-text">
          <h3>Welcome to FitChallenge, {username || 'Fitness Enthusiast'}!</h3>
          <p>Track your exercises, join challenges, and compete with friends to stay motivated.</p>
        </div>
        <button onClick={() => setDismissed(true)} className="welcome-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="welcome-actions">
        <a href="/challenges" className="btn btn-primary">Find a Challenge</a>
        <a href="/profile" className="btn btn-outline">Complete Profile</a>
      </div>
      
      <style jsx>{`
        .welcome-banner {
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
          position: relative;
        }
        
        .welcome-content {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .welcome-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-primary);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .welcome-text {
          flex: 1;
        }
        
        .welcome-text h3 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 1.1rem;
        }
        
        .welcome-text p {
          margin: 0;
          color: var(--color-text-light);
          font-size: 0.9rem;
        }
        
        .welcome-close-btn {
          background: transparent;
          border: none;
          color: var(--color-text-light);
          padding: 0;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .welcome-close-btn:hover {
          color: var(--color-text);
        }
        
        .welcome-actions {
          display: flex;
          gap: var(--spacing-md);
        }
        
        @media (max-width: 640px) {
          .welcome-actions {
            flex-direction: column;
          }
          
          .welcome-content {
            align-items: center;
            text-align: center;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}