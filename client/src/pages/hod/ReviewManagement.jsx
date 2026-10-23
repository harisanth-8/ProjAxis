import React, { useState, useEffect } from 'react';
import { Award, Users, CheckCircle, Send, Calendar, Clock, MapPin } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [panelMembers, setPanelMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Panel state
  const [targetReview, setTargetReview] = useState(null);
  const [selectedPanelIds, setSelectedPanelIds] = useState([]);
  const [savingPanel, setSavingPanel] = useState(false);

  // Publish Evaluation state
  const [evalToPublish, setEvalToPublish] = useState(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, evalRes, panelRes] = await Promise.all([
        api.get('/reviews'),
        api.get('/evaluations'),
        api.get('/users?role=panel')
      ]);
      setReviews(revRes.data || []);
      setEvaluations(evalRes.data || []);
      setPanelMembers(panelRes.data || []);
    } catch (err) {
      console.error('Failed to load review management data', err);
    } finally {
      setLoading(false);
    }
  };

  const openPanelModal = (rev) => {
    setTargetReview(rev);
    setSelectedPanelIds(rev.panelMembers?.map((pm) => pm._id || pm.userId) || []);
  };

  const handleSavePanel = async () => {
    if (!targetReview) return;
    setSavingPanel(true);
    try {
      await api.patch(`/reviews/${targetReview.reviewId}/assign-panel`, {
        panelMemberIds: selectedPanelIds
      });
      setTargetReview(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to assign panel members');
    } finally {
      setSavingPanel(false);
    }
  };

  const handlePublish = async () => {
    if (!evalToPublish) return;
    setPublishing(true);
    try {
      await api.post(`/evaluations/${evalToPublish.evaluationId}/publish`);
      setEvalToPublish(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to publish evaluation');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Review Panels & Evaluation Oversight</h2>
        <p className="text-muted small mb-0">
          Assign expert panel evaluators to scheduled milestones, monitor panel rubric submissions, and publish official marks.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* Review Sessions & Panel Assignments */}
          <div className="pa-card">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Scheduled Reviews & Panel Allocations</h5>
            {reviews.length === 0 ? (
              <div className="text-center py-4 text-muted small">No reviews scheduled yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Review Type</th>
                      <th>Project</th>
                      <th>Date & Venue</th>
                      <th>Assigned Panel Members</th>
                      <th>Review Status</th>
                      <th className="text-end">Panel Assignment</th>
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
                          <div className="small fw-medium text-dark">
                            {new Date(rev.reviewDate).toLocaleDateString()} at{' '}
                            {new Date(rev.reviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-muted small">{rev.venue}</div>
                        </td>
                        <td>
                          {(rev.panelMembers || rev.panelMemberIds)?.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {(rev.panelMembers || rev.panelMemberIds).map((pm) => (
                                <span key={pm._id || pm.userId} className="badge bg-primary-subtle text-primary border">
                                  {pm.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border">No panel assigned</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={rev.status} />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => openPanelModal(rev)}
                          >
                            <Users size={14} /> Assign Panel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Evaluations & Result Publishing */}
          <div className="pa-card">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Evaluation Marks & Publishing</h5>
            {evaluations.length === 0 ? (
              <div className="text-center py-4 text-muted small">No evaluation records created yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Evaluation ID</th>
                      <th>Review Type</th>
                      <th>Evaluation Status</th>
                      <th>Students Evaluated</th>
                      <th>Published At</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((ev) => (
                      <tr key={ev.evaluationId}>
                        <td>
                          <span className="fw-bold text-dark">{ev.evaluationId}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{ev.review?.reviewType || 'Review'}</span>
                        </td>
                        <td>
                          <StatusBadge status={ev.status} />
                        </td>
                        <td>
                          <span className="text-muted small">{ev.entries?.length || 0} Students</span>
                        </td>
                        <td>
                          <span className="text-muted small">
                            {ev.publishedAt ? new Date(ev.publishedAt).toLocaleDateString() : 'Not Published'}
                          </span>
                        </td>
                        <td className="text-end">
                          {ev.status === 'Submitted' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                              onClick={() => setEvalToPublish(ev)}
                            >
                              <Send size={14} /> Publish Results
                            </button>
                          ) : ev.status === 'Published' ? (
                            <span className="badge bg-success-subtle text-success border">Results Live</span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary border">Draft / In Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Panel Modal */}
      <Modal
        isOpen={!!targetReview}
        onClose={() => setTargetReview(null)}
        title={`Assign Review Panel - ${targetReview?.reviewType}`}
        size="md"
      >
        <div>
          <p className="text-muted small mb-3">
            Select faculty panel members to evaluate project{' '}
            <strong>
              {typeof targetReview?.projectId === 'object' && targetReview?.projectId !== null
                ? targetReview.projectId.projectId || targetReview.projectId.title
                : targetReview?.projectId}
            </strong>{' '}
            during session <strong>{targetReview?.reviewId}</strong>.
          </p>

          <div className="d-flex flex-column gap-2 mb-4">
            {panelMembers.map((pm) => {
              const id = pm._id || pm.userId;
              const isChecked = selectedPanelIds.includes(id);

              return (
                <div
                  key={id}
                  className={`p-3 rounded border d-flex align-items-center justify-content-between ${
                    isChecked ? 'bg-primary-subtle border-primary' : 'bg-light'
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (isChecked) {
                      setSelectedPanelIds(selectedPanelIds.filter((x) => x !== id));
                    } else {
                      setSelectedPanelIds([...selectedPanelIds, id]);
                    }
                  }}
                >
                  <div>
                    <div className="fw-bold text-dark">{pm.name}</div>
                    <div className="text-muted small">{pm.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div click
                  />
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setTargetReview(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={savingPanel || selectedPanelIds.length === 0}
              onClick={handleSavePanel}
            >
              {savingPanel ? 'Saving...' : 'Save Panel Allocation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Publish Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!evalToPublish}
        title="Publish Evaluation Marks?"
        message={`Are you sure you want to publish the marks for evaluation "${evalToPublish?.evaluationId}"? Once published, students will immediately be able to view their scores and final letter grades.`}
        confirmText="Publish Results"
        variant="success"
        onConfirm={handlePublish}
        onCancel={() => setEvalToPublish(null)}
      />
    </div>
  );
};

export default ReviewManagement;
