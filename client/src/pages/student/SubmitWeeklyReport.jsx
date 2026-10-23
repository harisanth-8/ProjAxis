import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import FileUpload from '../../components/common/FileUpload';
import api from '../../api/client';
import { Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const SubmitWeeklyReport = () => {
  const { projectId: paramProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  const navigate = useNavigate();

  const [activeProjectId, setActiveProjectId] = useState(paramProjectId || queryProjectId || '');
  const [project, setProject] = useState(null);
  const [weekNo, setWeekNo] = useState(1);
  const [workDone, setWorkDone] = useState('');
  const [plannedNext, setPlannedNext] = useState('');
  const [blockers, setBlockers] = useState('');
  const [progress, setProgress] = useState(25);
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initProject = async () => {
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

      if (targetId) {
        api.get(`/projects/${targetId}`)
          .then((res) => setProject(res.data))
          .catch((err) => setError(err.message || 'Failed to load project details'));

        api.get(`/projects/${targetId}/progress-reports`)
          .then((res) => {
            const count = res.data?.length || 0;
            setWeekNo(count + 1);
          })
          .catch(() => {});
      }
    };

    initProject();
  }, [activeProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId) {
      setError('No active project found to submit report for.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      weekNo: Number(weekNo),
      workDone,
      plannedNext,
      blockers,
      progress: Number(progress),
      remarks,
      attachmentDocumentIds: attachments.map((a) => a._id || a.documentId)
    };

    try {
      await api.post(`/projects/${activeProjectId}/progress-reports`, payload);
      navigate(`/projects/${activeProjectId}`);
    } catch (err) {
      setError(err.message || 'Failed to submit weekly report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '780px' }}>
      <div className="card shadow-none border p-4 p-md-5">
        <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
          <div
            className="p-3 rounded-circle"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <Clock size={28} />
          </div>
          <div>
            <h4 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
              Submit Weekly Progress Report
            </h4>
            <div className="text-muted small">
              {project ? `${project.projectId}: ${project.title}` : 'Capstone Project Report'}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <FormField label="Report Week Number" id="weekNo" required>
                <input
                  type="number"
                  id="weekNo"
                  className="form-control"
                  min="1"
                  max="52"
                  value={weekNo}
                  onChange={(e) => setWeekNo(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Team-Reported Progress (%)" id="progress" required helperText="Between 0% and 100%">
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="range"
                    className="form-range flex-grow-1"
                    min="0"
                    max="100"
                    id="progress-range"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                  />
                  <span className="badge bg-primary px-3 py-2 fs-6">{progress}%</span>
                </div>
              </FormField>
            </div>
          </div>

          <FormField label="Work Completed During Current Week" id="workDone" required helperText="Summarize specific milestones reached, modules coded, or tests performed">
            <textarea
              id="workDone"
              className="form-control"
              rows="3"
              placeholder="e.g. Configured ROS2 Humble camera publisher node and completed OpenCV checkerboard camera calibration."
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Planned Tasks for Next Week" id="plannedNext" required helperText="Outline immediate next steps">
            <textarea
              id="plannedNext"
              className="form-control"
              rows="3"
              placeholder="e.g. Run indoor localization tests in robotics corridor and tune ORB-SLAM3 parameters."
              value={plannedNext}
              onChange={(e) => setPlannedNext(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Technical Blockers / Impediments (Optional)" id="blockers">
            <textarea
              id="blockers"
              className="form-control"
              rows="2"
              placeholder="Describe any hardware faults, driver incompatibilities, or lab access needs..."
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </FormField>

          <FormField label="General Remarks / Comments for Guide" id="remarks">
            <input
              type="text"
              id="remarks"
              className="form-control"
              placeholder="Optional notes for your supervisor..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </FormField>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">
              Attach Report Document / Log Output (Optional)
            </label>
            <FileUpload
              category="Report"
              projectId={activeProjectId}
              onUploadSuccess={(doc) => setAttachments([...attachments, doc])}
            />
            {attachments.length > 0 && (
              <div className="small text-success mt-2">
                Attached {attachments.length} document(s).
              </div>
            )}
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
              disabled={loading || !activeProjectId}
            >
              <Send size={16} /> {loading ? 'Submitting...' : 'Submit Progress Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitWeeklyReport;
