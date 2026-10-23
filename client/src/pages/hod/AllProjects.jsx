import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Search, Filter, Eye, ArrowUpDown } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Spinner from '../../components/common/Spinner';

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId?.toLowerCase().includes(search.toLowerCase()) ||
      p.domain?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Department Project Registry</h2>
        <p className="text-muted small mb-0">
          Supervise and monitor all final-year undergraduate projects registered across the department.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="pa-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by ID, title, domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 col-lg-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Project Statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Final Submitted">Final Submitted</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-12 col-md-2 col-lg-5 text-md-end text-muted small">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No projects match the selected search and filter criteria.
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Project ID & Title</th>
                  <th>Domain</th>
                  <th>Assigned Guide</th>
                  <th>Team Members</th>
                  <th style={{ width: '160px' }}>Task Progress</th>
                  <th className="text-center">Reported Progress</th>
                  <th>Status</th>
                  <th className="text-end">Workspace</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => {
                  const tasks = proj.tasks || [];
                  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
                  const percent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : null;

                  return (
                    <tr key={proj.projectId}>
                      <td>
                        <div className="fw-bold text-dark">{proj.title}</div>
                        <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.72rem' }}>
                          {proj.projectId}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{proj.domain}</span>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{proj.guide?.name || 'Unassigned'}</div>
                        <div className="text-muted small">{proj.guide?.email}</div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                          {proj.students?.map((s) => (
                            <span key={s._id || s.userId} className="badge bg-light text-dark border">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {percent !== null ? (
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex justify-content-between text-muted small" style={{ fontSize: '0.72rem' }}>
                              <span>{doneTasks}/{tasks.length} Done</span>
                              <span>{percent}%</span>
                            </div>
                            <ProgressBar progress={percent} height={6} />
                          </div>
                        ) : (
                          <span className="text-muted small italic">No tasks yet</span>
                        )}
                      </td>
                      <td className="text-center">
                        {proj.latestReportProgress !== undefined ? (
                          <span className="fw-bold text-dark">{proj.latestReportProgress}%</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={proj.status} />
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/projects/${proj.projectId}`}
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProjects;
