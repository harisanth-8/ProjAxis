import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const GuideAllocation = () => {
  const [proposals, setProposals] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingProp, setAllocatingProp] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, guideRes] = await Promise.all([
        api.get('/proposals'),
        api.get('/users?role=guide')
      ]);
      setProposals(propRes.data || []);
      setGuides(guideRes.data || []);
    } catch (err) {
      console.error('Failed to load allocation data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prop) => {
    setAllocatingProp(prop);
    setError(null);
    setOverrideReason('');
    // Default to preferred mentor 1 if available
    if (prop.mentorChoices && prop.mentorChoices.length > 0) {
      const firstChoice = prop.mentorChoices[0];
      const match = guides.find((g) => (g._id || g.userId) === (firstChoice.guideId || firstChoice._id));
      if (match) {
        setSelectedGuideId(match._id || match.userId);
        return;
      }
    }
    if (guides.length > 0) {
      setSelectedGuideId(guides[0]._id || guides[0].userId);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!allocatingProp || !selectedGuideId) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.post(`/proposals/${allocatingProp.proposalId}/assign-guide`, {
        guideId: selectedGuideId,
        overrideReason: overrideReason.trim() ? overrideReason : undefined
      });
      setAllocatingProp(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to assign guide');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGuide = guides.find((g) => (g._id || g.userId) === selectedGuideId);
  const isSelectedAtCap = selectedGuide && (selectedGuide.activeProjectsCount || 0) >= (selectedGuide.capacityLimit || 8);

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Faculty Guide Allocation</h2>
        <p className="text-muted small mb-0">
          Match student project teams with department faculty supervisors according to student preferences and faculty capacity caps.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Proposal ID & Title</th>
                  <th>Domain</th>
                  <th>Student Team</th>
                  <th>Mentor Preferences</th>
                  <th>Assigned Guide</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((prop) => (
                  <tr key={prop.proposalId}>
                    <td>
                      <div className="fw-bold text-dark">{prop.title}</div>
                      <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.72rem' }}>
                        {prop.proposalId}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{prop.domain}</span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                        {prop.students?.map((s) => (
                          <span key={s._id || s.userId} className="badge bg-light text-dark border">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {prop.mentorChoices?.length > 0 ? (
                        <div className="small">
                          {prop.mentorChoices.map((mc, idx) => (
                            <div key={idx} className="text-muted">
                              <span className="fw-semibold">#{idx + 1}:</span> {mc.guideName || mc.name || 'Guide'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small italic">None specified</span>
                      )}
                    </td>
                    <td>
                      {prop.assignedGuide ? (
                        <div className="d-flex align-items-center gap-1 text-success fw-medium">
                          <CheckCircle size={14} />
                          <span>{prop.assignedGuide.name}</span>
                        </div>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={prop.approvalStatus} />
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenModal(prop)}
                      >
                        <UserCheck size={14} />
                        <span>{prop.assignedGuide ? 'Reallocate' : 'Assign Guide'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      <Modal
        isOpen={!!allocatingProp}
        onClose={() => setAllocatingProp(null)}
        title="Assign Faculty Guide"
        size="md"
      >
        <form onSubmit={handleAssign}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <div className="bg-light p-3 rounded mb-3 border">
            <div className="fw-bold text-dark">{allocatingProp?.title}</div>
            <div className="small text-muted">{allocatingProp?.proposalId}</div>

            {allocatingProp?.mentorChoices?.length > 0 && (
              <div className="mt-2 pt-2 border-top">
                <span className="small fw-semibold text-muted d-block mb-1">Student Preferred Mentors:</span>
                <ol className="small ps-3 mb-0 text-dark">
                  {allocatingProp.mentorChoices.map((mc, i) => (
                    <li key={i}>{mc.guideName || mc.name || 'Faculty'}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <FormField label="Select Department Guide" required>
            <select
              className="form-select"
              value={selectedGuideId}
              onChange={(e) => setSelectedGuideId(e.target.value)}
              required
            >
              {guides.map((g) => {
                const count = g.activeProjectsCount || 0;
                const cap = g.capacityLimit || 8;
                return (
                  <option key={g._id || g.userId} value={g._id || g.userId}>
                    {g.name} ({count}/{cap} teams assigned)
                  </option>
                );
              })}
            </select>
          </FormField>

          {isSelectedAtCap && (
            <div className="alert alert-warning py-2 small d-flex align-items-start gap-2">
              <AlertTriangle size={16} className="mt-1 flex-shrink-0" />
              <div>
                <strong>Capacity Warning:</strong> This faculty member has reached the supervision limit (8 projects).
                An override reason is required to assign this guide.
              </div>
            </div>
          )}

          {isSelectedAtCap && (
            <FormField label="Capacity Override Justification" required>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Specialized domain expertise in Computer Vision required by the student abstract..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
              />
            </FormField>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setAllocatingProp(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GuideAllocation;
