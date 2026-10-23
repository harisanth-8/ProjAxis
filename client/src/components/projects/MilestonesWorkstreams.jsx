import React, { useState } from 'react';
import { Flag, Layers, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from '../common/ProgressBar';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import ConfirmDialog from '../common/ConfirmDialog';

const MilestonesWorkstreams = ({ project, canManage, onRefresh }) => {
  const [showWsModal, setShowWsModal] = useState(false);
  const [showMsModal, setShowMsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // New Workstream form
  const [wsTitle, setWsTitle] = useState('');
  const [wsDesc, setWsDesc] = useState('');

  // New Milestone form
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  // Confirm milestone achievement
  const [milestoneToToggle, setMilestoneToToggle] = useState(null);

  const handleCreateWorkstream = async (e) => {
    e.preventDefault();
    if (!wsTitle.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/projects/${project.projectId}/workstreams`, {
        title: wsTitle,
        description: wsDesc,
        order: (project.workstreams?.length || 0) + 1
      });
      setWsTitle('');
      setWsDesc('');
      setShowWsModal(false);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create workstream');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!msTitle.trim() || !msDueDate) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/projects/${project.projectId}/milestones`, {
        title: msTitle,
        description: msDesc,
        dueDate: msDueDate
      });
      setMsTitle('');
      setMsDesc('');
      setMsDueDate('');
      setShowMsModal(false);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestone = async () => {
    if (!milestoneToToggle) return;
    try {
      const newStatus = milestoneToToggle.status === 'Achieved' ? 'Pending' : 'Achieved';
      await api.patch(`/projects/${project.projectId}/milestones/${milestoneToToggle.milestoneId}`, {
        status: newStatus
      });
      setMilestoneToToggle(null);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update milestone');
    }
  };

  const handleToggleWorkstream = async (ws) => {
    try {
      const newStatus = ws.status === 'Completed' ? 'Open' : 'Completed';
      await api.patch(`/projects/${project.projectId}/workstreams/${ws.workstreamId}`, {
        status: newStatus
      });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update workstream status');
    }
  };

  const workstreams = project.workstreams || [];
  const milestones = project.milestones || [];
  const tasks = project.tasks || [];

  return (
    <div className="row g-4">
      {/* Workstreams Section */}
      <div className="col-12 col-lg-6">
        <div className="pa-card h-100">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div className="d-flex align-items-center gap-2">
              <Layers size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Workstreams (Phases)</h5>
            </div>
            {canManage && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowWsModal(true)}
              >
                <Plus size={16} /> Add Workstream
              </button>
            )}
          </div>

          {workstreams.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No workstreams defined yet. Break down the project into phases like Requirements, Design, Implementation.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {workstreams.map((ws) => {
                const wsTasks = tasks.filter((t) => t.workstreamId === ws.workstreamId);
                const doneTasks = wsTasks.filter((t) => t.status === 'Done');
                const percent = wsTasks.length > 0 ? Math.round((doneTasks.length / wsTasks.length) * 100) : 0;
                const canComplete = wsTasks.length > 0 && wsTasks.every((t) => t.status === 'Done');

                return (
                  <div key={ws.workstreamId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="fw-semibold text-dark">{ws.title}</span>
                        {ws.description && <p className="text-muted small mb-0 mt-1">{ws.description}</p>}
                      </div>
                      <StatusBadge status={ws.status} />
                    </div>

                    <div className="my-2">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Task Completion ({doneTasks.length}/{wsTasks.length})</span>
                        <span>{percent}%</span>
                      </div>
                      <ProgressBar progress={percent} height={6} />
                    </div>

                    {canManage && (
                      <div className="d-flex justify-content-end mt-2">
                        {ws.status === 'Open' ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            disabled={!canComplete}
                            title={!canComplete ? 'All tasks in this workstream must be Done first' : 'Mark phase as completed'}
                            onClick={() => handleToggleWorkstream(ws)}
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleToggleWorkstream(ws)}
                          >
                            Reopen Workstream
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="col-12 col-lg-6">
        <div className="pa-card h-100">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div className="d-flex align-items-center gap-2">
              <Flag size={20} className="text-warning" />
              <h5 className="mb-0 fw-bold">Project Milestones</h5>
            </div>
            {canManage && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowMsModal(true)}
              >
                <Plus size={16} /> Add Milestone
              </button>
            )}
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No milestones defined yet. Track major deliverables and target completion dates.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {milestones.map((ms) => {
                const isOverdue = ms.status === 'Pending' && new Date(ms.dueDate) < new Date();
                return (
                  <div key={ms.milestoneId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-dark">{ms.title}</span>
                          <StatusBadge status={ms.status === 'Achieved' ? 'Achieved' : isOverdue ? 'Overdue' : 'Pending'} />
                        </div>
                        {ms.description && <p className="text-muted small mb-0 mt-1">{ms.description}</p>}
                      </div>
                      <div className="small text-muted text-end">
                        <div className="d-flex align-items-center gap-1">
                          <Clock size={13} />
                          <span>Due: {new Date(ms.dueDate).toLocaleDateString()}</span>
                        </div>
                        {ms.achievedAt && (
                          <span className="text-success small d-block">
                            Achieved: {new Date(ms.achievedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="d-flex justify-content-end mt-2">
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            ms.status === 'Achieved' ? 'btn-outline-secondary' : 'btn-outline-success'
                          }`}
                          onClick={() => setMilestoneToToggle(ms)}
                        >
                          {ms.status === 'Achieved' ? 'Mark as Pending' : 'Mark Achieved'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Workstream Modal */}
      <Modal
        isOpen={showWsModal}
        onClose={() => setShowWsModal(false)}
        title="Add Project Workstream"
        size="md"
      >
        <form onSubmit={handleCreateWorkstream}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <FormField label="Workstream Title" required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Requirements Analysis, Model Training"
              value={wsTitle}
              onChange={(e) => setWsTitle(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Scope and deliverables of this workstream"
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
            />
          </FormField>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowWsModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Workstream'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={showMsModal}
        onClose={() => setShowMsModal(false)}
        title="Add Project Milestone"
        size="md"
      >
        <form onSubmit={handleCreateMilestone}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <FormField label="Milestone Title" required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Design Approval, Dataset Preprocessed, Beta Release"
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Target Due Date" required>
            <input
              type="date"
              className="form-control"
              value={msDueDate}
              onChange={(e) => setMsDueDate(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Key checkpoints and achievement criteria"
              value={msDesc}
              onChange={(e) => setMsDesc(e.target.value)}
            />
          </FormField>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowMsModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Milestone Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!milestoneToToggle}
        title={milestoneToToggle?.status === 'Achieved' ? 'Mark Milestone Pending?' : 'Mark Milestone Achieved?'}
        message={`Are you sure you want to change the status of milestone "${milestoneToToggle?.title}"?`}
        confirmText="Confirm Change"
        variant={milestoneToToggle?.status === 'Achieved' ? 'secondary' : 'success'}
        onConfirm={handleToggleMilestone}
        onCancel={() => setMilestoneToToggle(null)}
      />
    </div>
  );
};

export default MilestonesWorkstreams;
