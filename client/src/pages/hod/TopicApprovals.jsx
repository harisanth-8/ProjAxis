import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, XCircle, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const TopicApprovals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE', 'REJECT', 'REVISE'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proposals');
      setProposals(res.data || []);
    } catch (err) {
      console.error('Failed to load proposals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (e) => {
    e.preventDefault();
    if (!selectedProposal || !actionType) return;
    if ((actionType === 'REJECT' || actionType === 'REVISE') && !comments.trim()) {
      setError('Comments / rationale are required for rejection or requesting revision.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let decisionStr = 'Approve';
    if (actionType === 'REJECT') decisionStr = 'Reject';
    if (actionType === 'REVISE') decisionStr = 'Request Revision';

    try {
      await api.post(`/proposals/${selectedProposal.proposalId}/hod-decision`, {
        decision: decisionStr,
        comments
      });
      setActionType(null);
      setComments('');
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to sanction proposal');
    } finally {
      setSubmitting(false);
    }
  };

  // Guide Approved proposals needing HOD sanction
  const pendingApprovals = proposals.filter((p) => p.approvalStatus === 'Guide Approved');
  const pastSanctions = proposals.filter((p) => p.approvalStatus !== 'Guide Approved');

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Final Project Topic Sanctions</h2>
        <p className="text-muted small mb-0">
          Review guide-endorsed abstracts and grant final departmental sanction to initialize the active project workspace.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* Pending Topic Approvals Card */}
          <div className="pa-card">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <FileCheck size={20} className="text-success" />
                <h5 className="mb-0 fw-bold">Topics Awaiting HOD Sanction ({pendingApprovals.length})</h5>
              </div>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No guide-approved project proposals currently pending departmental sanction.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Proposal ID & Title</th>
                      <th>Domain</th>
                      <th>Endorsing Guide</th>
                      <th>Student Team</th>
                      <th>Endorsement Date</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((prop) => (
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
                          <div className="fw-medium text-dark">{prop.assignedGuide?.name || 'Guide'}</div>
                          <div className="text-muted small">{prop.assignedGuide?.email}</div>
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
                        <td className="text-muted small">
                          {new Date(prop.updatedAt || prop.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                            onClick={() => setSelectedProposal(prop)}
                          >
                            <Eye size={14} /> Review Topic
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Decisions Registry */}
          <div className="pa-card">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Department Proposal Registry</h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Proposal</th>
                    <th>Guide</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSanctions.map((prop) => (
                    <tr key={prop.proposalId}>
                      <td>
                        <div className="fw-bold text-dark">{prop.title}</div>
                        <div className="text-muted small">{prop.proposalId}</div>
                      </td>
                      <td className="small">{prop.assignedGuide?.name || 'Unassigned'}</td>
                      <td>
                        <StatusBadge status={prop.approvalStatus} />
                      </td>
                      <td className="small text-muted">{new Date(prop.submissionDate).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedProposal(prop)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review & Decision Modal */}
      <Modal
        isOpen={!!selectedProposal && !actionType}
        onClose={() => setSelectedProposal(null)}
        title={`Project Topic Sanction: ${selectedProposal?.proposalId}`}
        size="lg"
      >
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h5 className="fw-bold text-dark mb-1">{selectedProposal?.title}</h5>
              <div className="text-muted small">Domain: {selectedProposal?.domain}</div>
            </div>
            <StatusBadge status={selectedProposal?.approvalStatus} />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <div className="p-3 bg-light rounded border">
                <span className="small fw-bold text-muted d-block mb-1">Assigned Guide:</span>
                <div className="fw-semibold text-dark">{selectedProposal?.assignedGuide?.name || 'Unassigned'}</div>
                <div className="small text-muted">{selectedProposal?.assignedGuide?.email}</div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-3 bg-light rounded border">
                <span className="small fw-bold text-muted d-block mb-1">Student Team:</span>
                <div className="d-flex flex-wrap gap-1">
                  {selectedProposal?.students?.map((s) => (
                    <span key={s._id || s.userId} className="badge bg-white text-dark border">
                      {s.name} ({s.studentProfile?.regNo || 'Reg'})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <h6 className="fw-bold text-dark">Problem Statement</h6>
            <div className="p-3 bg-light rounded border small text-muted">
              {selectedProposal?.problemStatement}
            </div>
          </div>

          <div className="mb-3">
            <h6 className="fw-bold text-dark">Objectives</h6>
            <div className="p-3 bg-light rounded border small text-muted">
              {selectedProposal?.objectives}
            </div>
          </div>

          <div className="mb-3">
            <h6 className="fw-bold text-dark">Methodology</h6>
            <div className="p-3 bg-light rounded border small text-muted">
              {selectedProposal?.methodology}
            </div>
          </div>

          {/* Decision trail */}
          {selectedProposal?.decisionHistory?.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-2">Previous Decision Records</h6>
              <div className="d-flex flex-column gap-2">
                {selectedProposal.decisionHistory.map((d, i) => (
                  <div key={i} className="border-start border-2 border-primary ps-3 py-1 bg-light rounded-end">
                    <div className="d-flex justify-content-between small">
                      <span className="fw-bold">{d.role?.toUpperCase()} Decision: {d.decision}</span>
                      <span className="text-muted">{new Date(d.at).toLocaleString()}</span>
                    </div>
                    {d.comments && <p className="small text-muted mb-0 mt-1">{d.comments}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProposal?.approvalStatus === 'Guide Approved' ? (
            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setActionType('REJECT')}
              >
                Reject Topic
              </button>
              <button
                type="button"
                className="btn btn-outline-warning"
                onClick={() => setActionType('REVISE')}
              >
                Request Revision
              </button>
              <button
                type="button"
                className="btn btn-success d-flex align-items-center gap-1"
                onClick={() => setActionType('APPROVE')}
              >
                <CheckCircle2 size={16} /> Sanction & Create Project
              </button>
            </div>
          ) : (
            <div className="d-flex justify-content-end pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedProposal(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        title={
          actionType === 'APPROVE'
            ? 'Sanction Topic & Initialize Active Project'
            : actionType === 'REJECT'
            ? 'Reject Topic Proposal'
            : 'Request Topic Revision'
        }
        size="md"
      >
        <form onSubmit={handleDecision}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <p className="small text-muted">
            {actionType === 'APPROVE'
              ? 'Sanctioning this topic will atomically create an Active Project record, assign the faculty supervisor, and notify all team members.'
              : actionType === 'REJECT'
              ? 'Please provide reasons for rejecting this topic. Rejections are final and the team must submit a new topic.'
              : 'Specify revision requirements for the team and guide.'}
          </p>

          <FormField
            label={actionType === 'APPROVE' ? 'Optional HOD Remarks' : 'Mandatory Feedback / Rationale'}
            required={actionType !== 'APPROVE'}
          >
            <textarea
              className="form-control"
              rows={4}
              placeholder={
                actionType === 'APPROVE'
                  ? 'e.g. Topic meets department academic rigor standards. Approved for academic year.'
                  : 'Specify reasons and required changes...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required={actionType !== 'APPROVE'}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setActionType(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${
                actionType === 'APPROVE'
                  ? 'btn-success'
                  : actionType === 'REJECT'
                  ? 'btn-danger'
                  : 'btn-warning'
              }`}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TopicApprovals;
