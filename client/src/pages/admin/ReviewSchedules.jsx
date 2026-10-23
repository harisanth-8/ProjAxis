import React, { useState, useEffect } from 'react';
import { Award, Calendar, Clock, MapPin, XCircle, Search } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';

const ReviewSchedules = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewToCancel, setReviewToCancel] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReview = async () => {
    if (!reviewToCancel) return;
    try {
      await api.patch(`/reviews/${reviewToCancel.reviewId}/cancel`);
      setReviewToCancel(null);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel review');
    }
  };

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Institution Review Schedules</h2>
        <p className="text-muted small mb-0">
          Institution-wide timetable of all project presentations, progress milestones, and viva defenses.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No review sessions currently scheduled in the platform.
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
                      <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.72rem' }}>
                        {rev.reviewId}
                      </span>
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
                      <div className="small fw-medium text-dark d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        <span>{new Date(rev.reviewDate).toLocaleDateString()}</span>
                      </div>
                      <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{new Date(rev.reviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="small text-muted d-flex align-items-center gap-1">
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
                        <span className="text-muted small italic">None assigned</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={rev.status} />
                    </td>
                    <td className="text-end">
                      {rev.status === 'Scheduled' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          onClick={() => setReviewToCancel(rev)}
                          title="Cancel scheduled session"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!reviewToCancel}
        title="Cancel Review Session?"
        message={`Are you sure you want to cancel ${reviewToCancel?.reviewType} for project ${
          typeof reviewToCancel?.projectId === 'object' && reviewToCancel?.projectId !== null
            ? reviewToCancel.projectId.projectId || reviewToCancel.projectId.title
            : reviewToCancel?.projectId
        }? All participants and panel members will be notified.`}
        confirmText="Cancel Review"
        variant="danger"
        onConfirm={handleCancelReview}
        onCancel={() => setReviewToCancel(null)}
      />
    </div>
  );
};

export default ReviewSchedules;
