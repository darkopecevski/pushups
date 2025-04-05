// src/components/Auth.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          // User is already logged in, redirect to home
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign up response:", data);
      
      // Check if we have a user and session
      if (data?.user) {
        // Show success message
        setSuccess('Account created successfully! Logging you in...');
        
        // Log the user in automatically
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        console.log("Sign in after signup response:", signInData);
        
        if (signInData?.session) {
          // Set cookies manually if needed
          document.cookie = `sb-access-token=${signInData.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `sb-refresh-token=${signInData.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
          
          // Redirect to home page
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } else {
        setError('Something went wrong during sign up. Please try again.');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      // Sign in the user
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign in response:", data);
      
      if (data?.session) {
        // Show success message
        setSuccess('Login successful! Redirecting...');
        
        // Set cookies manually if needed
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setError('Login successful but no session was created. Please try again.');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="loading">Checking authentication status...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{authMode === 'login' ? 'Login' : 'Sign Up'}</h1>
        
        <form onSubmit={authMode === 'login' ? handleSignIn : handleSignUp}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-toggle">
          {authMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setAuthMode('signup')}>Sign Up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setAuthMode('login')}>Login</button>
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .loading {
          text-align: center;
          padding: 2rem;
        }
        
        .success {
          background-color: #dcfce7;
          color: #166534;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}