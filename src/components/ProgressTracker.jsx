import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const initialForm = {
  week_number: '',
  weight: '',
  bodyfat: '',
  waist: '',
  neck: '',
  arm: '',
  thigh: '',
  bench: '',
  squat: '',
  deadlift: '',
  adherence: '',
};

const ProgressTracker = () => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Define which fields are integers and which are decimals
  const integerFields = [
    'week_number'
  ];
  const decimalFields = [
    'weight', 'bodyfat', 'waist', 'neck', 'arm', 'thigh',
    'bench', 'squat', 'deadlift', 'adherence'
  ];

  const cleanForm = (form) => {
    const cleaned = { ...form };
    integerFields.forEach((field) => {
      if (cleaned[field] === '' || cleaned[field] === undefined || isNaN(cleaned[field])) {
        cleaned[field] = null;
      } else {
        cleaned[field] = parseInt(cleaned[field], 10);
      }
    });
    decimalFields.forEach((field) => {
      if (cleaned[field] === '' || cleaned[field] === undefined || isNaN(cleaned[field])) {
        cleaned[field] = null;
      } else {
        cleaned[field] = parseFloat(cleaned[field]);
      }
    });
    // For all other fields, convert empty string to null
    Object.keys(cleaned).forEach((key) => {
      if (cleaned[key] === '') {
        cleaned[key] = null;
      }
    });
    return cleaned;
  };

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError('');
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Could not fetch user.');
        setLoading(false);
        return;
      }
      setUser(user);
      const { data, error: progressError } = await supabase
        .from('weekly_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });
      if (progressError) {
        setError('Could not fetch progress data.');
        setLoading(false);
        return;
      }
      setProgress(data || []);
      setLoading(false);
    };
    fetchProgress();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setForm(initialForm);
    setFormMode('add');
    setEditingId(null);
    setShowForm(true);
    setActionError('');
  };

  const openEditForm = (row) => {
    // Prefill the form with the selected row's data, converting nulls to '' for text fields
    const prefill = { ...row };
    Object.keys(prefill).forEach((key) => {
      if (prefill[key] === null || prefill[key] === undefined) {
        prefill[key] = '';
      }
    });
    setForm(prefill);
    setFormMode('edit');
    setEditingId(row.id);
    setShowForm(true);
    setActionError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(initialForm);
    setEditingId(null);
    setActionError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      const cleaned = cleanForm(form);
      cleaned.energy = '';
      cleaned.workout = '';
      cleaned.notes = '';
      if (formMode === 'add') {
        const { error: insertError } = await supabase
          .from('weekly_progress')
          .insert([{ ...cleaned, user_id: user.id }]);
        if (insertError) throw insertError;
      } else if (formMode === 'edit') {
        const { error: updateError } = await supabase
          .from('weekly_progress')
          .update({ ...cleaned })
          .eq('id', editingId);
        if (updateError) throw updateError;
      }
      // Refresh data
      const { data, error: progressError } = await supabase
        .from('weekly_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });
      if (progressError) throw progressError;
      setProgress(data || []);
      closeForm();
    } catch (err) {
      setActionError('Could not save progress.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    setActionLoading(true);
    setActionError('');
    try {
      const { error: deleteError } = await supabase
        .from('weekly_progress')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;
      // Refresh data
      const { data, error: progressError } = await supabase
        .from('weekly_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });
      if (progressError) throw progressError;
      setProgress(data || []);
    } catch (err) {
      setActionError('Could not delete entry.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)' }}>
      <h2>Weekly Progress Tracking</h2>
      <button className="add-btn" onClick={openAddForm} style={{ marginBottom: 16 }}>
        ➕ Add Progress
      </button>
      {showForm && (
        <div className="modal">
          <form className="progress-form" onSubmit={handleSubmit}>
            <button type="button" className="close-btn" onClick={closeForm} aria-label="Close">×</button>
            <h3>{formMode === 'add' ? 'Add Progress' : 'Edit Progress'}</h3>
            <div className="form-section">
              <div className="section-title">Measurements</div>
              <div className="form-grid">
                <label>
                  Week Number
                  <input name="week_number" type="number" value={form.week_number} onChange={handleInputChange} required min="1" placeholder="e.g. 1" />
                </label>
                <label>
                  Weight (kg)
                  <input name="weight" type="number" step="0.1" value={form.weight} onChange={handleInputChange} required placeholder="e.g. 82.5" />
                </label>
                <label>
                  Body Fat %
                  <input name="bodyfat" type="number" step="0.1" value={form.bodyfat} onChange={handleInputChange} placeholder="e.g. 18.2" />
                </label>
                <label>
                  Waist (cm)
                  <input name="waist" type="number" step="0.1" value={form.waist} onChange={handleInputChange} placeholder="e.g. 85" />
                </label>
                <label>
                  Neck (cm)
                  <input name="neck" type="number" step="0.1" value={form.neck} onChange={handleInputChange} placeholder="e.g. 39" />
                </label>
                <label>
                  Arm (cm)
                  <input name="arm" type="number" step="0.1" value={form.arm} onChange={handleInputChange} placeholder="e.g. 34" />
                </label>
                <label>
                  Thigh (cm)
                  <input name="thigh" type="number" step="0.1" value={form.thigh} onChange={handleInputChange} placeholder="e.g. 56" />
                </label>
              </div>
            </div>
            <div className="form-section">
              <div className="section-title">Lifts</div>
              <div className="form-grid">
                <label>
                  Bench (kg)
                  <input name="bench" type="number" step="0.1" value={form.bench} onChange={handleInputChange} placeholder="e.g. 80" />
                </label>
                <label>
                  Squat (kg)
                  <input name="squat" type="number" step="0.1" value={form.squat} onChange={handleInputChange} placeholder="e.g. 100" />
                </label>
                <label>
                  Deadlift (kg)
                  <input name="deadlift" type="number" step="0.1" value={form.deadlift} onChange={handleInputChange} placeholder="e.g. 120" />
                </label>
              </div>
            </div>
            <div className="form-section">
              <div className="section-title">Wellness</div>
              <div className="form-grid">
                <label>
                  Adherence %
                  <input name="adherence" type="number" step="0.1" value={form.adherence} onChange={handleInputChange} placeholder="e.g. 95" />
                </label>
              </div>
            </div>
            {actionError && <p style={{ color: 'var(--color-error)', marginTop: 8 }}>{actionError}</p>}
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="cancel-btn" onClick={closeForm} disabled={actionLoading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
      ) : progress.length === 0 ? (
        <p>No progress data found. Start by adding your first week's progress.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="progress-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Weight (kg)</th>
                <th>Body Fat %</th>
                <th>Waist (cm)</th>
                <th>Neck (cm)</th>
                <th>Arm (cm)</th>
                <th>Thigh (cm)</th>
                <th>Bench (kg)</th>
                <th>Squat (kg)</th>
                <th>Deadlift (kg)</th>
                <th>Adherence %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((row) => (
                <tr key={row.id}>
                  <td>{row.week_number}</td>
                  <td>{row.weight}</td>
                  <td>{row.bodyfat}</td>
                  <td>{row.waist}</td>
                  <td>{row.neck}</td>
                  <td>{row.arm}</td>
                  <td>{row.thigh}</td>
                  <td>{row.bench}</td>
                  <td>{row.squat}</td>
                  <td>{row.deadlift}</td>
                  <td>{row.adherence}</td>
                  <td>
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => openEditForm(row)}
                      disabled={actionLoading}
                      aria-label="Edit"
                      title="Edit"
                    >
                      {/* Pencil SVG */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDelete(row.id)}
                      disabled={actionLoading}
                      aria-label="Delete"
                      title="Delete"
                    >
                      {/* Trash SVG */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actionError && <p style={{ color: 'var(--color-error)' }}>{actionError}</p>}
        </div>
      )}
      <style jsx>{`
        .progress-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }
        .progress-table th, .progress-table td {
          border: 1px solid var(--color-border);
          padding: 0.5rem 0.75rem;
          text-align: center;
        }
        .progress-table th {
          background: var(--color-background);
          font-weight: 600;
        }
        .add-btn {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
        }
        .add-btn:hover {
          background: #059669;
        }
        .edit-btn, .delete-btn {
          margin: 0 4px;
          padding: 4px 10px;
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .edit-btn {
          background: #3b82f6;
          color: white;
        }
        .edit-btn:hover {
          background: #2563eb;
        }
        .delete-btn {
          background: #ef4444;
          color: white;
        }
        .delete-btn:hover {
          background: #b91c1c;
        }
        .modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.25);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2vw;
        }
        .progress-form {
          background: #fff;
          padding: 2.5rem 2rem 2rem 2rem;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.16);
          min-width: 320px;
          max-width: 900px;
          width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-bottom: 2.5rem;
          position: relative;
          box-sizing: border-box;
        }
        .close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          font-size: 2rem;
          color: #bdbdbd;
          cursor: pointer;
          transition: color 0.2s;
          z-index: 10;
        }
        .close-btn:hover {
          color: #ef4444;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.2rem 2rem;
          margin-bottom: 1.2rem;
          width: 100%;
        }
        @media (max-width: 1100px) {
          .progress-form {
            max-width: 98vw;
          }
          .form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 700px) {
          .progress-form {
            max-width: 100vw;
            min-width: 0;
            padding: 1.2rem 0.5rem 1.5rem 0.5rem;
          }
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
        .form-section {
          margin-bottom: 1.5rem;
        }
        .section-title {
          font-size: 1.08rem;
          font-weight: 600;
          color: #0c4a6e;
          margin-bottom: 0.7rem;
          letter-spacing: 0.01em;
        }
        .progress-form label {
          display: flex;
          flex-direction: column;
          font-size: 0.97rem;
          color: #222;
          font-weight: 500;
          gap: 0.3em;
        }
        .progress-form input[type="text"],
        .progress-form input[type="number"] {
          padding: 0.7em 1em;
          border: 1.5px solid #e6e6e6;
          border-radius: 8px;
          font-size: 1rem;
          margin-top: 0.2em;
          background: #f9fafb;
          transition: border 0.2s, box-shadow 0.2s;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .progress-form input:focus {
          border: 1.5px solid #3b82f6;
          outline: none;
          background: #fff;
          box-shadow: 0 0 0 2px #dbeafe;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        .save-btn {
          background: #10b981;
          color: white;
          padding: 8px 18px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(16,185,129,0.08);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .save-btn:hover:not(:disabled) {
          background: #059669;
          box-shadow: 0 4px 16px rgba(16,185,129,0.13);
        }
        .cancel-btn {
          background: #e5e7eb;
          color: #222;
          padding: 8px 18px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cancel-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cancel-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .icon-btn {
          background: none;
          border: none;
          border-radius: 50%;
          padding: 6px;
          margin: 0 2px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, box-shadow 0.15s;
          position: relative;
        }
        .icon-btn:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
          background: #e0e7ff;
        }
        .icon-btn.edit-btn:hover:not(:disabled) {
          background: #e0e7ff;
          box-shadow: 0 2px 8px rgba(37,99,235,0.08);
        }
        .icon-btn.delete-btn:hover:not(:disabled) {
          background: #fee2e2;
          box-shadow: 0 2px 8px rgba(239,68,68,0.08);
        }
        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
};

export default ProgressTracker; 