import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { KeyRound, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data?.message || 'If an account exists with this email, a reset link has been dispatched.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset request');
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
          <h3 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Reset Password</h3>
          <div className="text-muted small">Enter your email to receive a password recovery link.</div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="text-center py-3">
            <CheckCircle2 size={40} className="text-success mb-2" />
            <p className="small text-secondary mb-4">{message}</p>
            <Link to="/login" className="btn btn-outline-primary btn-sm">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormField label="Registered Email" id="email" required>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="name@projaxis.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3"
              disabled={loading}
            >
              {loading ? 'Submitting...' : (
                <>
                  <Mail size={18} /> Send Recovery Link
                </>
              )}
            </button>

            <div className="text-center small text-muted">
              Remember your credentials?{' '}
              <Link to="/login" className="fw-semibold">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
