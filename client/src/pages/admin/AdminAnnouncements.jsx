import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.post('/notifications/announcements', {
        title,
        message,
        targetRole
      });
      setTitle('');
      setMessage('');
      setSuccessMsg('Announcement successfully dispatched to target users!');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Institutional Announcements & Broadcasts</h2>
        <p className="text-muted small mb-0">
          Dispatch platform-wide alerts, deadline reminders, and administrative notices to students and faculty.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="pa-card">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Broadcast New Notice</h5>

            {successMsg && <div className="alert alert-success py-2 small">{successMsg}</div>}
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleBroadcast}>
              <FormField label="Target Audience" required>
                <select
                  className="form-select"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                >
                  <option value="ALL">Entire Campus (All Users)</option>
                  <option value="student">Undergraduate Students</option>
                  <option value="guide">Project Guides & Faculty</option>
                  <option value="hod">Department Heads (HODs)</option>
                  <option value="panel">Review Panel Members</option>
                </select>
              </FormField>

              <FormField label="Announcement Subject" required>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Final Viva Submission Deadline Extended"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Notice Content" required>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Official notification text..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </FormField>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="pa-card">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Dispatched Announcements</h5>

            {loading ? (
              <div className="text-center py-4">
                <Spinner />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No announcements have been broadcasted yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="fw-bold text-dark">{ann.title || 'Official Announcement'}</span>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        Target: {ann.targetRole || 'ALL'}
                      </span>
                    </div>
                    <p className="text-muted small mb-2">{ann.message}</p>
                    <div className="text-muted small border-top pt-2" style={{ fontSize: '0.75rem' }}>
                      Sent on {new Date(ann.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
