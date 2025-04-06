// src/components/PasswordResetConfirm.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PasswordResetConfirm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hash, setHash] = useState('');
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    // Parse URL parameters
    const queryString = window.location.hash;
    if (queryString) {
      const urlParams = new URLSearchParams(queryString.replace('#', '?'));
      const accessToken = urlParams.get('access_token');
      const type = urlParams.get('type');
      const emailParam = urlParams.get('email');
      
      if (accessToken && type === 'recovery') {
        setHash(queryString);
        if (emailParam) {
          setEmail(emailParam);
        }
      }
    }
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ 
        type: 'error', 
        text: 'Passwords do not match' 
      });
      return;
    }
    
    if (password.length < 6) {
      setMessage({ 
        type: 'error', 
        text: 'Password should be at least 6 characters long' 
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Password has been updated successfully! You will be redirected to login.' 
      });
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        window.location.href = '/auth';
      }, 3000);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'An error occurred while updating your password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-confirm-container">
      <h2>Set New Password</h2>
      
      {!hash ? (
        <div className="invalid-link">
          <p>Invalid or expired password reset link.</p>
          <p>Please request a new password reset from the login page.</p>
          <a href="/auth" className="btn btn-primary">Go to Login</a>
        </div>
      ) : (
        <>
          <p className="description">
            {email ? `Create a new password for ${email}` : 'Create a new password for your account.'}
          </p>
          
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label htmlFor="password" className="form-label">New Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </>
      )}
      
      <style jsx>{`
        .password-reset-confirm-container {
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
        
        .invalid-link {
          text-align: center;
        }
        
        .invalid-link p {
          margin-bottom: var(--spacing-md);
          color: var(--color-text-light);
        }
        
        .invalid-link .btn {
          margin-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
}