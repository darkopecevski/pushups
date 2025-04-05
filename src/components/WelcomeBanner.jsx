// src/components/WelcomeBanner.jsx
import { useState } from 'react';

export default function WelcomeBanner({ username }) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <div className="welcome-banner">
      <div className="banner-content">
        <div className="banner-icon">💪</div>
        <div className="banner-text">
          <h3>Welcome to Pushups Challenge, {username || 'Fitness Enthusiast'}!</h3>
          <p>Track your exercises, join challenges, and compete with friends to stay motivated on your fitness journey.</p>
        </div>
      </div>
      
      <div className="banner-actions">
        <a href="/challenges" className="action-btn primary">Find a Challenge</a>
        <button onClick={() => setDismissed(true)} className="action-btn secondary">
          Dismiss
        </button>
      </div>
      
      <style jsx>{`
        .welcome-banner {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .banner-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .banner-icon {
          font-size: 3rem;
          background-color: rgba(255, 255, 255, 0.2);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .banner-text h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: white;
        }
        
        .banner-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .banner-actions {
          display: flex;
          gap: 1rem;
        }
        
        .action-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        
        .action-btn.primary {
          background-color: white;
          color: #4f46e5;
          text-decoration: none;
        }
        
        .action-btn.primary:hover {
          background-color: rgba(255, 255, 255, 0.9);
        }
        
        .action-btn.secondary {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
        }
        
        .action-btn.secondary:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 640px) {
          .banner-content {
            flex-direction: column;
            text-align: center;
          }
          
          .banner-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}