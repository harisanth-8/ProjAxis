import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { GraduationCap, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collegeName, setCollegeName] = useState('ProjAxis Academic Institute');

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.collegeName) setCollegeName(res.data.collegeName);
    }).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      const role = data.user.roles[0];
      if (data.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate(`/${role}/dashboard`);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="card shadow-sm border p-4 p-md-5 w-100" style={{ maxWidth: '440px', borderRadius: '12px' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-2"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <GraduationCap size={36} />
          </div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>ProjAxis</h2>
          <div className="text-muted small">{collegeName}</div>
          <div className="small text-secondary mt-1">College Project Management Platform</div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <FormField label="Email Address" id="email" required>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. student1@projaxis.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Password" id="password" required>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/forgot-password" className="small text-decoration-none">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center small text-muted mb-4">
          Don't have an account?{' '}
          <Link to="/register" className="fw-semibold">
            Register here
          </Link>
        </div>

        {/* Quick Demo Fill Buttons for Testing & Demonstration */}
        <div className="border-top pt-3">
          <div className="small fw-semibold text-secondary text-uppercase mb-2 text-center" style={{ fontSize: '0.72rem' }}>
            Quick Demo Accounts (Password: Password@123)
          </div>
          <div className="d-flex flex-wrap gap-1 justify-content-center">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => fillDemoAccount('admin@projaxis.edu')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => fillDemoAccount('hod.cse@projaxis.edu')}
            >
              HOD
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => fillDemoAccount('guide.subramanian@projaxis.edu')}
            >
              Guide
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => fillDemoAccount('panel.radhakrishnan@projaxis.edu')}
            >
              Panel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => fillDemoAccount('student1@projaxis.edu')}
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
