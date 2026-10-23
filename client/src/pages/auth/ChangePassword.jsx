import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
  const { user, activeRole, updateUserState } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      updateUserState({ mustChangePassword: false });
      setTimeout(() => {
        navigate(`/${activeRole}/dashboard`);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '480px' }}>
      <div className="card shadow-none border p-4 p-md-5">
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-2"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <KeyRound size={28} />
          </div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>
            {user?.mustChangePassword ? 'Mandatory Password Change' : 'Change Password'}
          </h4>
          <div className="text-muted small">
            {user?.mustChangePassword
              ? 'Your account was initialized with a temporary password. You must set a personal password before continuing.'
              : 'Enter your existing password and choose a secure new one.'}
          </div>
        </div>

        {user?.mustChangePassword && (
          <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>First-login security policy requires updating your password.</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="alert alert-success py-3 text-center small">
            <CheckCircle2 size={24} className="mb-2 text-success" />
            <div>Password updated successfully! Redirecting to dashboard...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField label="Current Password" id="currentPassword" required>
              <input
                type="password"
                id="currentPassword"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="New Password" id="newPassword" required helperText="At least 6 characters">
              <input
                type="password"
                id="newPassword"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Confirm New Password" id="confirmPassword" required>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mt-2"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
