import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Search, Filter, Eye, Edit } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const ProjectRecords = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Change status modal
  const [targetProject, setTargetProject] = useState(null);
  const [newStatus, setNewStatus] = useState('Active');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load project records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetProject) return;
    setSavingStatus(true);
    try {
      await api.patch(`/projects/${targetProject.projectId}/status`, {
        status: newStatus
      });
      setTargetProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const filtered = projects.filter((p) => {
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
        <h2 className="fw-bold text-dark mb-1">Institutional Project Records</h2>
        <p className="text-muted small mb-0">
          Supervise project lifecycle states, inspect student teams, and manage administrative project statuses.
        </p>
      </div>

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
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Final Submitted">Final Submitted</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-12 col-md-2 col-lg-5 text-md-end text-muted small">
            Showing {filtered.length} of {projects.length} records
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No project records found matching your filters.
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Project ID & Title</th>
                  <th>Domain</th>
                  <th>Faculty Guide</th>
                  <th>Students</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((proj) => (
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
                    <td className="small text-muted">{proj.guide?.name || 'Unassigned'}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                        {proj.students?.map((s) => (
                          <span key={s._id || s.userId} className="badge bg-light text-dark border">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="small text-muted">{proj.academicYear}</td>
                    <td>
                      <StatusBadge status={proj.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                          onClick={() => {
                            setTargetProject(proj);
                            setNewStatus(proj.status);
                          }}
                          title="Change project status"
                        >
                          <Edit size={14} /> Status
                        </button>
                        <Link
                          to={`/projects/${proj.projectId}`}
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        >
                          <Eye size={14} /> Workspace
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Modal */}
      <Modal
        isOpen={!!targetProject}
        onClose={() => setTargetProject(null)}
        title={`Change Status - ${targetProject?.projectId}`}
        size="md"
      >
        <form onSubmit={handleUpdateStatus}>
          <p className="small text-muted mb-3">
            Modify lifecycle status for <strong>{targetProject?.title}</strong>.
          </p>

          <FormField label="Target Status" required>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Final Submitted">Final Submitted</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setTargetProject(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingStatus}>
              {savingStatus ? 'Updating...' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectRecords;
