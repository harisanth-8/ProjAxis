import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Spinner from '../../components/common/Spinner';

const MyTeams = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load supervised teams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page text-center py-5">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Supervised Student Teams</h2>
        <p className="text-muted small mb-0">
          Monitor your active project batches, track task milestones, and enter project workspaces.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          You currently have no assigned student project teams.
        </div>
      ) : (
        <div className="row g-4">
          {projects.map((proj) => {
            const tasks = proj.tasks || [];
            const doneTasks = tasks.filter((t) => t.status === 'Done').length;
            const taskProgress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : null;

            return (
              <div key={proj.projectId} className="col-12 col-lg-6">
                <div className="pa-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-dark text-white px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        {proj.projectId}
                      </span>
                      <StatusBadge status={proj.status} />
                    </div>

                    <h5 className="fw-bold text-dark mb-1">{proj.title}</h5>
                    <div className="text-muted small mb-3">Domain: {proj.domain}</div>

                    {/* Team Members */}
                    <div className="mb-3">
                      <div className="small fw-semibold text-muted mb-1 d-flex align-items-center gap-1">
                        <Users size={14} /> Team Members:
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {proj.students?.map((s) => (
                          <span key={s._id || s.userId} className="badge bg-light text-dark border">
                            {s.name} ({s.studentProfile?.regNo || 'Reg'})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Metrics */}
                    <div className="bg-light p-3 rounded mb-3 border">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Task Completion ({doneTasks}/{tasks.length})</span>
                        <span className="fw-bold">{taskProgress !== null ? `${taskProgress}%` : 'No tasks yet'}</span>
                      </div>
                      {taskProgress !== null ? (
                        <ProgressBar progress={taskProgress} height={6} />
                      ) : (
                        <div className="text-muted small italic" style={{ fontSize: '0.75rem' }}>
                          Tasks have not yet been created for this project.
                        </div>
                      )}

                      {proj.latestReportProgress !== undefined && (
                        <div className="mt-2 pt-2 border-top d-flex justify-content-between small text-muted">
                          <span>Team-Reported Progress:</span>
                          <span className="fw-bold text-dark">{proj.latestReportProgress}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                    <span className="small text-muted">
                      Academic Year: {proj.academicYear}
                    </span>
                    <Link
                      to={`/projects/${proj.projectId}`}
                      className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
