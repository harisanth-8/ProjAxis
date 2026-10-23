import React, { useState, useEffect } from 'react';
import { Award, Plus, Calendar, Clock, MapPin, Users, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const ScheduleReview = () => {
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [reviewType, setReviewType] = useState('Review 1');
  const [reviewDate, setReviewDate] = useState('');
  const [venue, setVenue] = useState('Lab 302, Department of Computer Science');
  const [instructions, setInstructions] = useState('');

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Attendance Modal state
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, projRes] = await Promise.all([
        api.get('/reviews'),
        api.get('/projects')
      ]);
      setReviews(revRes.data || []);
      setProjects(projRes.data || []);
      if (projRes.data?.length > 0) {
        setProjectId(projRes.data[0].projectId);
      }
    } catch (err) {
      console.error('Failed to load review data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!projectId || !reviewDate || !venue.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews', {
        projectId,
        reviewType,
        reviewDate,
        venue,
        instructions
      });
      setShowModal(false);
      setInstructions('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to schedule review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate || !rescheduleReason.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.patch(`/reviews/${rescheduleTarget.reviewId}/reschedule`, {
        reviewDate: newDate,
        reason: rescheduleReason
      });
      setRescheduleTarget(null);
      setNewDate('');
      setRescheduleReason('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reschedule review');
    } finally {
      setSubmitting(false);
    }
  };

  const openAttendanceModal = async (rev) => {
    setAttendanceTarget(rev);
    try {
      const res = await api.get(`/reviews/${rev.reviewId}/attendance`);
      if (res.data?.records && res.data.records.length > 0) {
        setAttendanceRecords(res.data.records);
      } else {
        // Find project students to populate blank record
        const proj = projects.find((p) => p.projectId === rev.projectId);
        const stList = proj?.students || [];
        setAttendanceRecords(
          stList.map((s) => ({
            studentId: s._id || s.userId,
            name: s.name,
            regNo: s.studentProfile?.regNo || '',
            status: 'Present',
            note: ''
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const handleSaveAttendance = async () => {
    if (!attendanceTarget) return;
    setSavingAttendance(true);
    try {
      await api.post(`/reviews/${attendanceTarget.reviewId}/attendance`, {
        records: attendanceRecords.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note || ''
        }))
      });
      setAttendanceTarget(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to record attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Project Review Scheduling & Attendance</h2>
          <p className="text-muted small mb-0">
            Organize formal review milestones (Review 1, 2, 3, Final Viva), record student attendance, and track evaluations.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
          disabled={projects.length === 0}
        >
          <Plus size={16} /> Schedule Review Session
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No reviews scheduled yet. Click "Schedule Review Session" to set up an evaluation milestone.
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Review Type</th>
                  <th>Project ID</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Panel Members</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev.reviewId}>
                    <td>
                      <div className="fw-bold text-dark">{rev.reviewType}</div>
                      <div className="text-muted small">{rev.reviewId}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {typeof rev.projectId === 'object' && rev.projectId !== null
                          ? rev.projectId.projectId || rev.projectId.title || 'Project'
                          : String(rev.projectId || 'N/A')}
                      </span>
                      {typeof rev.projectId === 'object' && rev.projectId?.title && (
                        <div className="small text-muted text-truncate" style={{ maxWidth: '180px' }}>
                          {rev.projectId.title}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-dark small fw-medium">
                        <Calendar size={13} />
                        <span>{new Date(rev.reviewDate).toLocaleDateString()}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted small" style={{ fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{new Date(rev.reviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-muted">
                        <MapPin size={13} />
                        <span>{rev.venue}</span>
                      </div>
                    </td>
                    <td>
                      {(rev.panelMembers || rev.panelMemberIds)?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {(rev.panelMembers || rev.panelMemberIds).map((pm) => (
                            <span key={pm._id || pm.userId} className="badge bg-info-subtle text-info border">
                              {pm.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small italic">Pending HOD assignment</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={rev.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => openAttendanceModal(rev)}
                          title="Record or update attendance"
                        >
                          <CheckCircle size={14} /> Attendance
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                          onClick={() => {
                            setRescheduleTarget(rev);
                            setNewDate(new Date(rev.reviewDate).toISOString().slice(0, 16));
                          }}
                          title="Reschedule session"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Project Review"
        size="md"
      >
        <form onSubmit={handleSchedule}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="Target Project" required>
            <select
              className="form-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectId} - {p.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Review Stage / Type" required>
            <select
              className="form-select"
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value)}
              required
            >
              <option value="Review 1">Review 1 (Problem Definition & Requirements)</option>
              <option value="Review 2">Review 2 (Architecture & Midterm Implementation)</option>
              <option value="Review 3">Review 3 (Testing & Final Demo)</option>
              <option value="Final Viva">Final Viva (Comprehensive Defense)</option>
              <option value="Guide Meeting">Guide Review Meeting</option>
            </select>
          </FormField>

          <FormField label="Date and Time" required>
            <input
              type="datetime-local"
              className="form-control"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Venue / Location" required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Lab 304, Seminar Hall A, Google Meet"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Instructions for Students & Panel">
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Please bring 2 hard copies of the draft report and your slide deck."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Project Review"
        size="md"
      >
        <form onSubmit={handleReschedule}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="New Date and Time" required>
            <input
              type="datetime-local"
              className="form-control"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Reason for Rescheduling" required>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Faculty panel conflict, student medical leave, lab schedule shift..."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              required
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setRescheduleTarget(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={submitting}>
              {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={!!attendanceTarget}
        onClose={() => setAttendanceTarget(null)}
        title={`Record Attendance - ${attendanceTarget?.reviewType}`}
        size="lg"
      >
        <div>
          <p className="text-muted small mb-3">
            Mark student presence for review <strong>{attendanceTarget?.reviewId}</strong>. Records are logged with timestamp.
          </p>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student Name</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((rec, idx) => (
                  <tr key={rec.studentId || idx}>
                    <td>
                      <div className="fw-bold">{rec.name || rec.studentId}</div>
                      {rec.regNo && <div className="text-muted small">{rec.regNo}</div>}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {['Present', 'Absent', 'Excused'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`btn btn-sm ${
                              rec.status === st
                                ? st === 'Present'
                                  ? 'btn-success'
                                  : st === 'Absent'
                                  ? 'btn-danger'
                                  : 'btn-warning'
                                : 'btn-outline-secondary'
                            }`}
                            onClick={() => {
                              const updated = [...attendanceRecords];
                              updated[idx].status = st;
                              setAttendanceRecords(updated);
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Optional remarks"
                        value={rec.note || ''}
                        onChange={(e) => {
                          const updated = [...attendanceRecords];
                          updated[idx].note = e.target.value;
                          setAttendanceRecords(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setAttendanceTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={savingAttendance}
              onClick={handleSaveAttendance}
            >
              {savingAttendance ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleReview;
