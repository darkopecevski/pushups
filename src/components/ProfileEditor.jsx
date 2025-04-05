// src/components/ProfileEditor.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileEditor({ profile: initialProfile }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Reset form when profile changes
  useEffect(() => {
    if (initialProfile) {
      setUsername(initialProfile.username || '');
      setFullName(initialProfile.full_name || '');
      setAvatarUrl(initialProfile.avatar_url || '');
    }
  }, [initialProfile]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if username already exists (if changed)
      if (username !== initialProfile?.username) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id);
          
        if (checkError) throw checkError;
        
        if (existingUsers && existingUsers.length > 0) {
          throw new Error('Username already taken');
        }
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully' 
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error updating profile' 
      });
    } finally {
      setLoading(false);
      
      // Clear success message after 3 seconds
      if (message.type === 'success') {
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
        
        {avatarUrl && (
          <div className="avatar-preview">
            <img 
              src={avatarUrl} 
              alt="Avatar preview" 
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=Error';
                e.target.alt = 'Invalid image URL';
              }}
            />
          </div>
        )}
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <button type="submit" disabled={loading} className="save-profile-btn">
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
      
      <style jsx>{`
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-group label {
          font-weight: 500;
        }
        
        .form-group input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .avatar-preview {
          margin-top: 0.5rem;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
        }
        
        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .message {
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .message.success {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .message.error {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .save-profile-btn {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        
        .save-profile-btn:hover {
          background-color: #4338ca;
        }
        
        .save-profile-btn:disabled {
          background-color: #a5a5a5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}