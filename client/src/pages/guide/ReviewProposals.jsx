import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, RefreshCw, Eye, History, User } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';

const ReviewProposals = () => {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE', 'REJECT', 'REVISE'
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proposals');
      const list = res.data || [];
      setProposals(list);
      if (preselectedId) {
        const found = list.find((p) => p.proposalId === preselectedId);
        if (found) setSelectedProposal(found);
      }
    } catch (err) {
      console.error('Failed to load proposals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!selectedProposal || !actionType) return;
    if ((actionType === 'REJECT' || actionType === 'REVISE') && !commentText.trim()) {
      setError(`Comments/reasons are mandatory for ${actionType === 'REJECT' ? 'Rejection' : 'Requesting Revision'}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    let decisionStr = 'Approve';
    if (actionType === 'REJECT') decisionStr = 'Reject';
    if (actionType === 'REVISE') decisionStr = 'Request Revision';

    try {
      await api.post(`/proposals/${selectedProposal.proposalId}/guide-decision`, {
        decision: decisionStr,
        comments: commentText
      });
      setActionType(null);
      setCommentText('');
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit proposal decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Proposal Review & Topic Decision</h2>
        <p className="text-muted small mb-0">
          Evaluate submitted student abstracts, inspect problem statements, provide guidance, or request revisions.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No proposals currently assigned for your review.
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="pa-card">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Assigned Proposals</h5>
              <div className="d-flex flex-column gap-2">
                {proposals.map((prop) => {
                  const isSelected = selectedProposal?.proposalId === prop.proposalId;
                  return (
                    <div
                      key={prop.proposalId}
                      className={`p-3 rounded border cursor-pointer transition ${
                        isSelected ? 'border-primary bg-light shadow-sm' : 'border-light-subtle bg-white'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedProposal(prop)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-secondary" style={{ fontSize: '0.72rem' }}>
                          {prop.proposalId}
                        </span>
                        <StatusBadge status={prop.approvalStatus} />
                      </div>
                      <div className="fw-bold text-dark mt-1 text-truncate">{prop.title}</div>
                      <div className="small text-muted">{prop.domain}</div>
                      <div className="small text-muted mt-2 d-flex justify-content-between">
                        <span>Submitted: {new Date(prop.submissionDate).toLocaleDateString()}</span>
                        <span>v{prop.versions?.length || 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            {selectedProposal ? (
              <div className="pa-card">
                <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-dark">{selectedProposal.proposalId}</span>
                      <StatusBadge status={selectedProposal.approvalStatus} />
                      <span className="badge bg-light text-dark border">
                        Version {selectedProposal.versions?.length || 1}
                      </span>
                    </div>
                    <h4 className="fw-bold text-dark mb-0">{selectedProposal.title}</h4>
                    <span className="text-muted small">Domain: {selectedProposal.domain}</span>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mb-3 p-3 bg-light rounded border">
                  <span className="fw-bold text-dark d-block mb-1 small text-uppercase">Student Team</span>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedProposal.students?.map((std) => (
                      <span key={std._id || std.userId} className="badge bg-white text-dark border">
                        {std.name} ({std.studentProfile?.regNo || std.email})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark">Problem Statement</h6>
                  <p className="text-muted small bg-light p-3 rounded border">
                    {selectedProposal.problemStatement}
                  </p>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark">Objectives</h6>
                  <p className="text-muted small bg-light p-3 rounded border">
                    {selectedProposal.objectives}
                  </p>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark">Methodology</h6>
                  <p className="text-muted small bg-light p-3 rounded border">
                    {selectedProposal.methodology}
                  </p>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark">Expected Outcome</h6>
                  <p className="text-muted small bg-light p-3 rounded border">
                    {selectedProposal.expectedOutcome}
                  </p>
                </div>

                {/* Version & Decision History */}
                {selectedProposal.decisionHistory?.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-2">Decision Trail</h6>
                    <div className="d-flex flex-column gap-2">
                      {selectedProposal.decisionHistory.map((d, i) => (
                        <div key={i} className="border-start border-2 border-primary ps-3 py-1">
                          <div className="d-flex justify-content-between small">
                            <span className="fw-bold">{d.role?.toUpperCase()} Decision: {d.decision}</span>
                            <span className="text-muted">{new Date(d.at).toLocaleString()}</span>
                          </div>
                          {d.comments && <p className="small text-muted mb-0">{d.comments}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decision Actions (allowed when With Guide or Draft or Revision) */}
                {selectedProposal.approvalStatus === 'With Guide' && (
                  <div className="d-flex flex-wrap gap-2 pt-3 border-top justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger d-flex align-items-center gap-1"
                      onClick={() => setActionType('REJECT')}
                    >
                      <XCircle size={16} /> Reject Proposal
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning d-flex align-items-center gap-1"
                      onClick={() => setActionType('REVISE')}
                    >
                      <RefreshCw size={16} /> Request Revision
                    </button>
                    <button
                      type="button"
                      className="btn btn-success d-flex align-items-center gap-1"
                      onClick={() => setActionType('APPROVE')}
                    >
                      <CheckCircle size={16} /> Approve Topic
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pa-card text-center py-5 text-muted">
                Select a proposal from the left list to review its complete details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        title={
          actionType === 'APPROVE'
            ? 'Approve Project Proposal'
            : actionType === 'REJECT'
            ? 'Reject Project Proposal'
            : 'Request Proposal Revision'
        }
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDecision();
          }}
        >
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <p className="small text-muted">
            {actionType === 'APPROVE'
              ? 'Approving will record your faculty endorsement and forward the topic to the HOD for final approval.'
              : actionType === 'REJECT'
              ? 'Please specify clear reasons for rejecting this topic. The team will be notified to prepare a new proposal.'
              : 'Specify revision requirements for the team. The students will update their proposal as a new version.'}
          </p>

          <FormField
            label={actionType === 'APPROVE' ? 'Optional Endorsement Remarks' : 'Detailed Comments / Reasons'}
            required={actionType !== 'APPROVE'}
          >
            <textarea
              className="form-control"
              rows={4}
              placeholder={
                actionType === 'APPROVE'
                  ? 'e.g. Topic well structured and feasible within the timeline.'
                  : 'Specify feedback and necessary corrections...'
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
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
              {submitting ? 'Submitting...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReviewProposals;
