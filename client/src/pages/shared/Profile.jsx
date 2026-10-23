import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { User, Mail, Phone, Building, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, activeRole, updateUserState } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.put('/auth/profile', { name, phone });
      updateUserState(res.data.user);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>User Profile</h4>
          <div className="text-muted small">Manage your account credentials and personal information</div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Card: Account Overview */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-none p-4 text-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mb-3 fw-bold fs-3"
              style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-navy)' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h5 className="fw-bold mb-1">{user?.name}</h5>
            <div className="text-muted small mb-3">{user?.email}</div>

            <div className="d-flex justify-content-center gap-1 mb-3">
              {user?.roles?.map((r) => (
                <span key={r} className="badge bg-secondary text-uppercase">
                  {r}
                </span>
              ))}
            </div>

            <div className="border-top pt-3 text-start small">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">User ID:</span>
                <span className="fw-medium">{user?.userId}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Department:</span>
                <span className="fw-medium">{user?.departmentId?.name || 'General'}</span>
              </div>
              {user?.student?.regNo && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Register Number:</span>
                  <span className="fw-medium">{user?.student?.regNo}</span>
                </div>
              )}
              {user?.guide?.facultyId && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Faculty ID:</span>
                  <span className="fw-medium">{user?.guide?.facultyId}</span>
                </div>
              )}
              {user?.hod?.hodId && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">HOD ID:</span>
                  <span className="fw-medium">{user?.hod?.hodId}</span>
                </div>
              )}
              {user?.panel?.panelId && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Panel ID:</span>
                  <span className="fw-medium">{user?.panel?.panelId}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Account Status:</span>
                <span className="badge bg-success">{user?.accountStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Editable Details */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--color-navy)' }}>
              Edit Personal Details
            </h6>

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <FormField label="Full Name" id="profile-name" required>
                    <input
                      type="text"
                      id="profile-name"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </FormField>
                </div>

                <div className="col-12 col-md-6">
                  <FormField label="Phone Number" id="profile-phone">
                    <input
                      type="tel"
                      id="profile-phone"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="col-12 col-md-6">
                  <FormField label="Email Address (Institutional)" id="profile-email">
                    <input
                      type="email"
                      id="profile-email"
                      className="form-control bg-light"
                      value={user?.email || ''}
                      disabled
                    />
                  </FormField>
                </div>

                <div className="col-12 col-md-6">
                  <FormField label="Assigned Department" id="profile-dept">
                    <input
                      type="text"
                      id="profile-dept"
                      className="form-control bg-light"
                      value={user?.departmentId?.name || 'General / Unassigned'}
                      disabled
                    />
                  </FormField>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
