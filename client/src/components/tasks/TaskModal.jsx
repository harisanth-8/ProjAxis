import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import StatusBadge from '../common/StatusBadge';
import api from '../../api/client';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const TaskModal = ({
  isOpen,
  onClose,
  task = null,
  projectId,
  teamMembers = [],
  workstreams = [],
  milestones = [],
  onTaskSaved
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [workstreamId, setWorkstreamId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [commentText, setCommentText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isGuide = (user?.roles || []).includes('guide');
  const isAdmin = (user?.roles || []).includes('admin');
  const isStudent = (user?.roles || []).includes('student');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId?._id || task.assigneeId || '');
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'To Do');
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setWorkstreamId(task.workstreamId?._id || task.workstreamId || '');
      setMilestoneId(task.milestoneId?._id || task.milestoneId || '');
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(user?._id || user?.userId || '');
      setPriority('Medium');
      setStatus('To Do');
      setStartDate('');
      setDueDate('');
      setWorkstreamId('');
      setMilestoneId('');
    }
    setError(null);
  }, [task, user?._id, user?.userId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title,
      description,
      assigneeId: assigneeId || null,
      priority,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      workstreamId: workstreamId || null,
      milestoneId: milestoneId || null
    };

    try {
      let saved;
      if (task) {
        const res = await api.put(`/tasks/${task._id}`, payload);
        saved = res.data;
      } else {
        const res = await api.post(`/projects/${projectId}/tasks`, payload);
        saved = res.data;
      }
      onTaskSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return;
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: commentText });
      setCommentText('');
      onTaskSaved(res.data);
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? `Task Details (${task.taskId})` : 'Create New Project Task'}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormField label="Task Title" id="task-title" required>
          <input
            type="text"
            id="task-title"
            className="form-control"
            placeholder="e.g. Implement sensor driver"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Description & Acceptance Criteria" id="task-desc">
          <textarea
            id="task-desc"
            className="form-control"
            rows="3"
            placeholder="Describe what needs to be implemented and verified..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <FormField label="Assignee (Team Member)" id="task-assignee">
              <select
                id="task-assignee"
                className="form-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.student?.regNo || 'Student'})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="col-12 col-md-6">
            <FormField label="Priority" id="task-priority">
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Highest">Highest</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Lowest">Lowest</option>
              </select>
            </FormField>
          </div>

          <div className="col-12 col-md-6">
            <FormField label="Status" id="task-status" helperText={isStudent ? 'Only Guide or Admin can set Done or reopen Under Review' : ''}>
              <select
                id="task-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Blocked">Blocked</option>
                {(isGuide || isAdmin) && <option value="Done">Done (Guide/Admin)</option>}
              </select>
            </FormField>
          </div>

          <div className="col-12 col-md-6">
            <FormField label="Workstream" id="task-workstream">
              <select
                id="task-workstream"
                className="form-select"
                value={workstreamId}
                onChange={(e) => setWorkstreamId(e.target.value)}
              >
                <option value="">None / General</option>
                {workstreams.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.workstreamId}: {w.title}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="col-12 col-md-6">
            <FormField label="Start Date" id="task-start-date">
              <input
                type="date"
                id="task-start-date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="col-12 col-md-6">
            <FormField label="Due Date" id="task-due-date">
              <input
                type="date"
                id="task-due-date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Comments Feed (if editing existing task) */}
        {task && (
          <div className="border-top pt-3 mt-3">
            <h6 className="fw-bold mb-2 small text-uppercase" style={{ color: 'var(--color-navy)' }}>
              Activity Comments ({task.comments?.length || 0})
            </h6>

            <div className="d-flex flex-column gap-2 mb-3 overflow-y-auto" style={{ maxHeight: '160px' }}>
              {task.comments?.length === 0 ? (
                <div className="text-muted small">No comments yet.</div>
              ) : (
                task.comments?.map((c, i) => (
                  <div key={i} className="p-2 bg-light rounded small">
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                      <span className="fw-bold">{c.author?.name || 'Team Member'}</span>
                      <span>{new Date(c.at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1">{c.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TaskModal;
