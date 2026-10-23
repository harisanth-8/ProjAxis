import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Missing or invalid reset token. Please request a new link.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="card shadow-sm border p-4 p-md-5 w-100" style={{ maxWidth: '440px', borderRadius: '12px' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-2"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <KeyRound size={32} />
          </div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Set New Password</h3>
          <div className="text-muted small">Choose a strong password to secure your account.</div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-3">
            <CheckCircle2 size={40} className="text-success mb-2" />
            <h5 className="fw-bold mb-2">Password Reset Successful!</h5>
            <p className="small text-secondary mb-4">Your password has been updated. You can now log in.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField label="New Password" id="newPassword" required helperText="At least 6 characters">
              <input
                type="password"
                id="newPassword"
                className="form-control"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Confirm Password" id="confirmPassword" required>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : (
                <>
                  <Lock size={18} /> Update Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
