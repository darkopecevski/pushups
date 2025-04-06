// src/components/PasswordReset.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ 
        type: 'error', 
        text: 'Please enter a valid email address' 
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Use Supabase's password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`,
      });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Please check your inbox (and spam folder).' 
      });
      
      // Clear email field after successful submission
      setEmail('');
      
    } catch (err) {
      console.error('Error during password reset:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'An error occurred during password reset' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-container">
      <h2>Reset Your Password</h2>
      <p className="description">
        Enter your email address below and we'll send you instructions to reset your password.
      </p>
      
      <form onSubmit={handlePasswordReset}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>
      
      <div className="back-to-login">
        <a href="/auth">Back to Login</a>
      </div>
      
      <style jsx>{`
        .password-reset-container {
          max-width: 400px;
          margin: 0 auto;
          padding: var(--spacing-lg);
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
        }
        
        h2 {
          text-align: center;
          margin-bottom: var(--spacing-md);
        }
        
        .description {
          color: var(--color-text-light);
          margin-bottom: var(--spacing-lg);
          text-align: center;
        }
        
        .form-group {
          margin-bottom: var(--spacing-lg);
        }
        
        .message {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }
        
        .message.success {
          background-color: rgba(0, 166, 153, 0.1);
          color: var(--color-success);
        }
        
        .message.error {
          background-color: rgba(255, 90, 95, 0.1);
          color: var(--color-error);
        }
        
        .btn-block {
          width: 100%;
        }
        
        .back-to-login {
          text-align: center;
          margin-top: var(--spacing-lg);
        }
      `}</style>
    </div>
  );
}