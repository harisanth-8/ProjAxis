import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const EvaluationForm = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [project, setProject] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Default rubric criteria
  const defaultRubric = [
    { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
    { criterion: 'System Architecture & Methodology', maxMarks: 10 },
    { criterion: 'Implementation & Experimental Validation', maxMarks: 10 },
    { criterion: 'Technical Presentation & Demonstration', maxMarks: 10 },
    { criterion: 'Oral Viva Defense & Question Answering', maxMarks: 10 }
  ];

  const [rubric, setRubric] = useState(defaultRubric);
  // scores state: map of studentId -> { scores: [10, 8, ...], comments: '' }
  const [studentScores, setStudentScores] = useState({});

  useEffect(() => {
    fetchEvaluationData();
  }, [reviewId]);

  const fetchEvaluationData = async () => {
    setLoading(true);
    try {
      const revRes = await api.get(`/reviews/${reviewId}`);
      const rev = revRes.data;
      setReview(rev);

      if (rev.projectId) {
        const projId = typeof rev.projectId === 'object' && rev.projectId !== null
          ? rev.projectId.projectId || rev.projectId._id
          : rev.projectId;
        const projRes = await api.get(`/projects/${projId}`).catch(() => ({ data: typeof rev.projectId === 'object' ? rev.projectId : null }));
        const currentProject = projRes.data || (typeof rev.projectId === 'object' ? rev.projectId : null);
        setProject(currentProject);

        // Fetch or initialize evaluation
        const evalRes = await api.get(`/reviews/${reviewId}/evaluation`).catch(() => ({ data: null }));
        const ev = evalRes.data;
        setEvaluation(ev);

        const currentRubric = ev?.rubric?.length > 0 ? ev.rubric : defaultRubric;
        setRubric(currentRubric);

        // Prepopulate scores from existing evaluation entries if current user already scored
        const initial = {};
        (projRes.data.students || []).forEach((s) => {
          const sId = s._id || s.userId;
          initial[sId] = {
            scores: new Array(currentRubric.length).fill(8),
            comments: ''
          };
        });

        if (ev?.entries) {
          ev.entries.forEach((entry) => {
            if (entry.myScores) {
              initial[entry.studentId] = {
                scores: entry.myScores.scores || initial[entry.studentId]?.scores,
                comments: entry.myScores.comments || ''
              };
            }
          });
        }

        setStudentScores(initial);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load evaluation sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, criterionIndex, value) => {
    const val = Math.max(0, Math.min(Number(value) || 0, rubric[criterionIndex].maxMarks));
    setStudentScores((prev) => {
      const current = prev[studentId] || { scores: new Array(rubric.length).fill(0), comments: '' };
      const newScores = [...current.scores];
      newScores[criterionIndex] = val;
      return {
        ...prev,
        [studentId]: {
          ...current,
          scores: newScores
        }
      };
    });
  };

  const handleCommentsChange = (studentId, comments) => {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { scores: new Array(rubric.length).fill(0) }),
        comments
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const entries = Object.keys(studentScores).map((studentId) => {
      const item = studentScores[studentId];
      const total = item.scores.reduce((acc, curr) => acc + curr, 0);
      return {
        studentId,
        scores: item.scores,
        total,
        comments: item.comments
      };
    });

    try {
      await api.post(`/evaluations/${reviewId}/submit`, {
        rubric,
        entries
      });
      setSuccessMsg('Your rubric evaluation scores have been officially recorded!');
      setTimeout(() => {
        navigate('/panel/assigned-projects');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page text-center py-5">
        <Spinner size="lg" />
      </div>
    );
  }

  const students = project?.students || [];

  return (
    <div className="pa-page">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/panel/assigned-projects')}
        >
          <ChevronLeft size={16} /> Back to Assigned Reviews
        </button>
      </div>

      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge bg-dark">{review?.reviewId}</span>
          <span className="badge bg-primary">{review?.reviewType}</span>
          <StatusBadge status={review?.status} />
        </div>
        <h2 className="fw-bold text-dark mb-1">{project?.title}</h2>
        <p className="text-muted small mb-0">Project ID: {project?.projectId} | Domain: {project?.domain}</p>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-4">
          {students.map((student) => {
            const studentId = student._id || student.userId;
            const currentData = studentScores[studentId] || {
              scores: new Array(rubric.length).fill(0),
              comments: ''
            };
            const totalScore = currentData.scores.reduce((a, b) => a + b, 0);
            const maxPossible = rubric.reduce((a, b) => a + b.maxMarks, 0);

            return (
              <div key={studentId} className="pa-card">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">{student.name}</h5>
                    <div className="text-muted small">
                      {student.studentProfile?.regNo || student.email}
                    </div>
                  </div>
                  <div className="badge bg-primary px-3 py-2 fs-6">
                    Total Score: {totalScore} / {maxPossible}
                  </div>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '60%' }}>Evaluation Criterion</th>
                        <th className="text-center" style={{ width: '20%' }}>Max Marks</th>
                        <th className="text-center" style={{ width: '20%' }}>Awarded Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubric.map((crit, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="fw-medium text-dark">{crit.criterion}</div>
                          </td>
                          <td className="text-center text-muted fw-bold">{crit.maxMarks}</td>
                          <td className="text-center">
                            <input
                              type="number"
                              min="0"
                              max={crit.maxMarks}
                              className="form-control form-control-sm text-center mx-auto"
                              style={{ maxWidth: '80px' }}
                              value={currentData.scores[idx] ?? 0}
                              onChange={(e) => handleScoreChange(studentId, idx, e.target.value)}
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <FormField label="Evaluation Feedback & Viva Defense Comments">
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Specific remarks on defense clarity, demonstration, and conceptual understanding..."
                    value={currentData.comments}
                    onChange={(e) => handleCommentsChange(studentId, e.target.value)}
                  />
                </FormField>
              </div>
            );
          })}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/panel/assigned-projects')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center gap-2"
            disabled={submitting}
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? 'Submitting Evaluation...' : 'Submit Final Evaluation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvaluationForm;
