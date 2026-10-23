import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import FileUpload from '../../components/common/FileUpload';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import api from '../../api/client';
import { Send, CheckCircle2, AlertCircle, FileCheck, ExternalLink } from 'lucide-react';

const FinalSubmission = () => {
  const { projectId: paramProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  const navigate = useNavigate();

  const [activeProjectId, setActiveProjectId] = useState(paramProjectId || queryProjectId || '');
  const [project, setProject] = useState(null);
  const [finalTitle, setFinalTitle] = useState('');
  const [finalAbstract, setFinalAbstract] = useState('');
  const [technologies, setTechnologies] = useState('React, Node.js, Express, MongoDB');
  const [repositoryUrl, setRepositoryUrl] = useState('https://github.com/institution/capstone-project');
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let targetId = activeProjectId;
      if (!targetId) {
        try {
          const listRes = await api.get('/projects');
          const myActive = listRes.data?.find((p) => p.status === 'Active') || listRes.data?.[0];
          if (myActive) {
            targetId = myActive.projectId;
            setActiveProjectId(targetId);
          }
        } catch {
          // ignore
        }
      }

      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const [projRes, docRes] = await Promise.all([
          api.get(`/projects/${targetId}`),
          api.get('/documents', { params: { projectId: targetId, category: 'Report' } }).catch(() => ({ data: [] }))
        ]);
        setProject(projRes.data);
        setFinalTitle(projRes.data.title || '');
        setFinalAbstract(projRes.data.description || '');
        setDocuments(docRes.data || projRes.data.documents || []);
      } catch (err) {
        setError(err.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeProjectId]);

  const handleSubmit = async () => {
    if (!activeProjectId) return;
    setError(null);
    setSubmitting(true);
    setShowConfirm(false);

    const techArray = technologies.split(',').map((t) => t.trim()).filter((t) => t);

    try {
      await api.post(`/projects/${activeProjectId}/final-submit`, {
        finalTitle,
        finalAbstract,
        technologiesUsed: techArray.length ? techArray : ['FullStack MERN', 'MongoDB'],
        repositoryUrl
      });
      navigate(`/projects/${activeProjectId}`);
    } catch (err) {
      setError(err.message || 'Final submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner message="Loading final submission portal..." />;

  const hasReportDoc = documents.length > 0 || project?.documents?.length > 0;

  return (
    <div className="container py-4" style={{ maxWidth: '820px' }}>
      <div className="card shadow-none border p-4 p-md-5">
        <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
          <div
            className="p-3 rounded-circle"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <FileCheck size={32} />
          </div>
          <div>
            <h4 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
              Final Project Submission (S4)
            </h4>
            <div className="text-muted small">
              Official capstone completion submission for Viva Voce and Department Evaluation
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }}>
          <FormField label="Final Thesis / Project Title" id="finalTitle" required>
            <input
              type="text"
              id="finalTitle"
              className="form-control"
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Comprehensive Final Abstract" id="finalAbstract" required helperText="Provide full abstract summarizing the completed work, benchmarks, and conclusions">
            <textarea
              id="finalAbstract"
              className="form-control"
              rows="4"
              value={finalAbstract}
              onChange={(e) => setFinalAbstract(e.target.value)}
              required
            />
          </FormField>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField label="Technologies & Tools Used" id="technologies" required helperText="Comma separated (e.g. ROS2, Python, PyTorch, C++)">
                <input
                  type="text"
                  id="technologies"
                  className="form-control"
                  placeholder="React, Express, MongoDB, Python"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Source Code Repository URL" id="repositoryUrl" required helperText="Must be a valid URL (GitHub, GitLab, etc.)">
                <input
                  type="url"
                  id="repositoryUrl"
                  className="form-control"
                  placeholder="https://github.com/organization/project-repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  required
                />
              </FormField>
            </div>
          </div>

          {/* Mandatory Final Report Verification */}
          <div className="card p-3 my-4 bg-light border">
            <h6 className="fw-bold mb-2 small text-uppercase" style={{ color: 'var(--color-navy)' }}>
              Final Project Report Document (Mandatory Requirement)
            </h6>
            <p className="small text-muted mb-3">
              Per college regulations, a complete dissertation report under the "Report" category is required before final submission.
            </p>

            {hasReportDoc ? (
              <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <CheckCircle2 size={16} />
                <span>Final project report verified for {activeProjectId}.</span>
              </div>
            ) : (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={16} />
                <span>No Report document detected. Please upload your final report PDF below.</span>
              </div>
            )}

            <FileUpload
              category="Report"
              projectId={activeProjectId}
              onUploadSuccess={(doc) => setDocuments([...documents, doc])}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate(activeProjectId ? `/projects/${activeProjectId}` : '/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-1"
              disabled={submitting || !finalTitle || !finalAbstract || !repositoryUrl}
            >
              <Send size={16} /> Complete Final Project Submission
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Confirm Final Project Submission"
        message="Are you certain you want to make the final project submission? Once submitted, the project state moves to 'Final Submitted' for Guide confirmation and Final Viva evaluation."
        confirmText="Confirm Final Submission"
        loading={submitting}
      />
    </div>
  );
};

export default FinalSubmission;
