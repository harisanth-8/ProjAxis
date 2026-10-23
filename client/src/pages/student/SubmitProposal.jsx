import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../api/client';
import { FileText, Save, Send, AlertCircle, CheckCircle2, History } from 'lucide-react';

const SubmitProposal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProposalId = searchParams.get('id');

  const [proposal, setProposal] = useState(null);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objectives, setObjectives] = useState('');
  const [methodology, setMethodology] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [mentorChoices, setMentorChoices] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editProposalId);
  const [error, setError] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    // Fetch available guides for mentor selection
    api.get('/users/guides').then((res) => {
      setAvailableGuides(res.data || []);
    }).catch(() => {});

    // If editing existing proposal
    if (editProposalId) {
      api.get(`/proposals/${editProposalId}`)
        .then((res) => {
          const p = res.data;
          setProposal(p);
          setTitle(p.title);
          setDomain(p.domain);
          setDescription(p.description || '');
          setProblemStatement(p.problemStatement);
          setObjectives(p.objectives);
          setMethodology(p.methodology);
          setExpectedOutcome(p.expectedOutcome);
          setMentorChoices(p.mentorChoices?.map((m) => m._id) || []);
        })
        .catch((err) => setError(err.message))
        .finally(() => setInitialLoading(false));
    }
  }, [editProposalId]);

  const handleMentorToggle = (guideId) => {
    if (mentorChoices.includes(guideId)) {
      setMentorChoices(mentorChoices.filter((id) => id !== guideId));
    } else {
      if (mentorChoices.length >= 3) {
        setError('You can select at most 3 preferred mentors in order of priority');
        return;
      }
      setMentorChoices([...mentorChoices, guideId]);
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    setLoading(true);

    const payload = {
      title,
      domain,
      description,
      problemStatement,
      objectives,
      methodology,
      expectedOutcome,
      mentorChoices
    };

    try {
      if (proposal) {
        const res = await api.put(`/proposals/${proposal._id}`, payload);
        setProposal(res.data);
      } else {
        const res = await api.post('/proposals', payload);
        setProposal(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save draft proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async () => {
    setError(null);
    setLoading(true);
    setShowConfirmSubmit(false);

    try {
      let targetId = proposal?._id;

      if (!targetId) {
        // Save first if new
        const createRes = await api.post('/proposals', {
          title,
          domain,
          description,
          problemStatement,
          objectives,
          methodology,
          expectedOutcome,
          mentorChoices
        });
        targetId = createRes.data._id;
      }

      if (proposal && proposal.approvalStatus === 'Revision Required') {
        // Resubmit revision
        await api.post(`/proposals/${targetId}/resubmit`, {
          title,
          domain,
          description,
          problemStatement,
          objectives,
          methodology,
          expectedOutcome
        });
      } else {
        // Initial submission
        await api.post(`/proposals/${targetId}/submit`);
      }

      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Spinner message="Loading proposal details..." />;

  const isRevisionMode = proposal?.approvalStatus === 'Revision Required';

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
              {isRevisionMode ? 'Resubmit Proposal Revision' : proposal ? 'Edit Project Proposal' : 'Submit Project Abstract Proposal'}
            </h4>
            {proposal && <StatusBadge status={proposal.approvalStatus} />}
          </div>
          <div className="text-muted small">
            Define research objectives, methodologies, domain scope, and guide preferences
          </div>
        </div>
      </div>

      {isRevisionMode && (
        <div className="alert alert-warning shadow-none mb-4">
          <div className="fw-bold mb-1">Revisions Requested by Reviewer:</div>
          <div className="small">
            {proposal.decisionHistory?.[proposal.decisionHistory.length - 1]?.comments || 'Please revise your technical scope and methodology as instructed.'}
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Main Proposal Form */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--color-navy)' }}>
              1. Project Core Details
            </h6>

            <FormField label="Project Title" id="title" required>
              <input
                type="text"
                id="title"
                className="form-control"
                placeholder="e.g. Autonomous Drone Navigation Using Visual SLAM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <FormField label="Domain / Specialization" id="domain" required>
                  <input
                    type="text"
                    id="domain"
                    className="form-control"
                    placeholder="e.g. Artificial Intelligence, Blockchain, IoT"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="col-12 col-md-6">
                <FormField label="Department" id="dept">
                  <input
                    type="text"
                    id="dept"
                    className="form-control bg-light"
                    value={user?.departmentId?.name || 'Computer Science & Engineering'}
                    disabled
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Brief Overview" id="description">
              <textarea
                id="description"
                className="form-control"
                rows="2"
                placeholder="Executive summary of the proposed final year project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>

            <h6 className="fw-bold mt-4 mb-3 border-bottom pb-2" style={{ color: 'var(--color-navy)' }}>
              2. Technical Problem & Methodology
            </h6>

            <FormField label="Problem Statement" id="problemStatement" required helperText="Identify the exact research gap, inefficiency, or challenge addressed">
              <textarea
                id="problemStatement"
                className="form-control"
                rows="3"
                placeholder="State the core technical problem..."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Objectives" id="objectives" required helperText="List measurable goals of the system">
              <textarea
                id="objectives"
                className="form-control"
                rows="3"
                placeholder="1. Design... 2. Implement... 3. Benchmark..."
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Proposed Methodology & Architecture" id="methodology" required helperText="Specify toolchains, frameworks, hardware, and algorithms">
              <textarea
                id="methodology"
                className="form-control"
                rows="3"
                placeholder="Describe algorithms, models, datasets, and component interactions..."
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Expected Outcome & Deliverables" id="expectedOutcome" required>
              <textarea
                id="expectedOutcome"
                className="form-control"
                rows="3"
                placeholder="Tangible output, prototype, patent, or research publication target..."
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {/* Right Column: Mentor Choices & Submission Controls */}
        <div className="col-12 col-lg-4">
          {/* Preferred Mentors Selection */}
          <div className="card shadow-none p-4 mb-4">
            <h6 className="fw-bold mb-2" style={{ color: 'var(--color-navy)' }}>
              Preferred Faculty Mentors (Up to 3)
            </h6>
            <p className="text-muted small mb-3">
              Select in order of preference. HOD will honor choices subject to guide capacity caps.
            </p>

            <div className="d-flex flex-column gap-2 mb-3">
              {availableGuides.map((guide) => {
                const isSelected = mentorChoices.includes(guide._id);
                const choiceIndex = mentorChoices.indexOf(guide._id);

                return (
                  <div
                    key={guide._id}
                    className={`p-2 rounded border d-flex justify-content-between align-items-center cursor-pointer ${
                      isSelected ? 'bg-light border-primary' : ''
                    }`}
                    onClick={() => handleMentorToggle(guide._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div className="small fw-semibold">{guide.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Load: {guide.activeProjectCount}/{guide.capacityCap} active projects
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="badge bg-primary">Choice #{choiceIndex + 1}</span>
                    ) : (
                      <span className="badge bg-light text-secondary border">+ Select</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>Actions</h6>

            <div className="d-flex flex-column gap-2">
              {!isRevisionMode && (!proposal || proposal.approvalStatus === 'Draft') && (
                <button
                  type="button"
                  className="btn btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                  onClick={handleSaveDraft}
                >
                  <Save size={16} /> Save as Draft
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={loading || !title || !problemStatement || !methodology}
                onClick={() => setShowConfirmSubmit(true)}
              >
                <Send size={16} /> {isRevisionMode ? 'Submit Revision Snapshot' : 'Submit Proposal for Review'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleSubmitProposal}
        title={isRevisionMode ? 'Resubmit Proposal Revision' : 'Submit Project Proposal'}
        message="Are you sure you want to officially submit this proposal? A permanent snapshot will be created in the version history for academic review."
        confirmText="Confirm & Submit"
        loading={loading}
      />
    </div>
  );
};

export default SubmitProposal;
