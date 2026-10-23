import React, { useState } from 'react';
import DataTable from '../common/DataTable';
import FilterBar from '../common/FilterBar';
import StatusBadge from '../common/StatusBadge';
import { Plus, Edit2, CalendarOff } from 'lucide-react';
import TaskModal from './TaskModal';

const TaskList = (props) => {
  const {
    project,
    canCreate = true,
    canManage = false,
    onRefresh = () => {},
    loading = false
  } = props;

  const tasks = props.tasks || project?.tasks || [];
  const teamMembers = props.teamMembers || project?.students || [];
  const workstreams = props.workstreams || project?.workstreams || [];
  const milestones = props.milestones || project?.milestones || [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [workstreamFilter, setWorkstreamFilter] = useState('');
  const [unscheduledOnly, setUnscheduledOnly] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSaved = () => {
    setIsModalOpen(false);
    onRefresh();
  };

  // Filter tasks locally
  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const matchTitle = t.title?.toLowerCase().includes(search.toLowerCase());
      const matchId = t.taskId?.toLowerCase().includes(search.toLowerCase());
      if (!matchTitle && !matchId) return false;
    }
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (assigneeFilter && (t.assigneeId?._id || t.assigneeId) !== assigneeFilter) return false;
    if (workstreamFilter && (t.workstreamId?._id || t.workstreamId) !== workstreamFilter) return false;
    if (unscheduledOnly && (t.startDate || t.dueDate)) return false;
    return true;
  });

  const columns = [
    {
      key: 'taskId',
      label: 'ID',
      width: '100px',
      sortable: true,
      render: (row) => (
        <span className="fw-bold" style={{ color: 'var(--color-navy)' }}>
          {row.taskId}
        </span>
      )
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold text-truncate" style={{ maxWidth: '280px' }}>
            {row.title}
          </div>
          {row.workstreamId && (
            <span className="badge bg-light text-secondary border me-1">
              {row.workstreamId?.workstreamId || 'WKS'}
            </span>
          )}
          {row.comments?.length > 0 && (
            <span className="text-muted text-xs" style={{ fontSize: '0.75rem' }}>
              💬 {row.comments.length}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'assigneeId',
      label: 'Assignee',
      render: (row) => (
        <span className="small">
          {row.assigneeId?.name || <span className="text-muted italic">Unassigned</span>}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      width: '110px',
      sortable: true,
      render: (row) => <StatusBadge status={row.priority} />
    },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: '120px',
      sortable: true,
      render: (row) => (
        <span className="small text-muted">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'Unscheduled'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      width: '80px',
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary p-1"
          title="Edit Task"
          onClick={() => handleOpenEdit(row)}
        >
          <Edit2 size={14} />
        </button>
      )
    }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
          Project Tasks ({filteredTasks.length} of {tasks.length})
        </h6>
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm ${unscheduledOnly ? 'btn-warning text-dark' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
            onClick={() => setUnscheduledOnly(!unscheduledOnly)}
          >
            <CalendarOff size={15} />
            <span>Unscheduled View</span>
          </button>
          {canCreate && (
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              onClick={handleOpenCreate}
            >
              <Plus size={15} /> Create Task
            </button>
          )}
        </div>
      </div>

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter tasks by title or task ID..."
        filters={[
          {
            label: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'To Do', value: 'To Do' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Under Review', value: 'Under Review' },
              { label: 'Blocked', value: 'Blocked' },
              { label: 'Done', value: 'Done' }
            ]
          },
          {
            label: 'All Priorities',
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: 'Highest', value: 'Highest' },
              { label: 'High', value: 'High' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Low', value: 'Low' },
              { label: 'Lowest', value: 'Lowest' }
            ]
          },
          {
            label: 'All Assignees',
            value: assigneeFilter,
            onChange: setAssigneeFilter,
            options: teamMembers.map((m) => ({ label: m.name, value: m._id || m.userId }))
          },
          {
            label: 'All Workstreams',
            value: workstreamFilter,
            onChange: setWorkstreamFilter,
            options: workstreams.map((w) => ({ label: `${w.workstreamId}: ${w.title}`, value: w._id || w.workstreamId }))
          }
        ]}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
          setPriorityFilter('');
          setAssigneeFilter('');
          setWorkstreamFilter('');
          setUnscheduledOnly(false);
        }}
      />

      <DataTable
        columns={columns}
        data={filteredTasks}
        loading={loading}
        emptyTitle="No Tasks Match Your Filters"
        emptyDescription="Try clearing filters or creating a new task."
      />

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          projectId={project?.projectId}
          teamMembers={teamMembers}
          workstreams={workstreams}
          milestones={milestones}
          onTaskSaved={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default TaskList;
