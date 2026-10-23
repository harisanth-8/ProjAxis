import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import TaskModal from '../tasks/TaskModal';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', color: '#64748B' },
  { id: 'In Progress', label: 'In Progress', color: '#2F65A7' },
  { id: 'Under Review', label: 'Under Review', color: '#C58B24' },
  { id: 'Blocked', label: 'Blocked', color: '#C94C4C' },
  { id: 'Done', label: 'Done', color: '#27856A' }
];

// Sortable Card Item with drag handle & accessible "Move to" menu
const KanbanCard = ({ task, onEdit, onMoveTo, isGuideOrAdmin, currentUserId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id
  });

  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const isAssignedToMe = (task.assigneeId?._id || task.assigneeId?.userId || task.assigneeId) === currentUserId;
  const canMove = isGuideOrAdmin || isAssignedToMe;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card shadow-none p-3 mb-2 border bg-white position-relative"
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          className="small fw-bold text-muted cursor-grab"
          {...attributes}
          {...listeners}
          style={{ cursor: canMove ? 'grab' : 'default' }}
        >
          {task.taskId}
        </span>

        <div className="d-flex align-items-center gap-1">
          <StatusBadge status={task.priority} />

          {/* Accessible Keyboard "Move to" menu */}
          <div className="dropdown position-relative">
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0"
              aria-label="Task options"
              onClick={() => setShowMoveMenu(!showMoveMenu)}
            >
              <MoreVertical size={15} />
            </button>

            {showMoveMenu && (
              <>
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 1040 }}
                  onClick={() => setShowMoveMenu(false)}
                />
                <div
                  className="position-absolute end-0 card shadow-sm p-2 border"
                  style={{ width: '170px', zIndex: 1050, fontSize: '0.8rem' }}
                >
                  <button
                    type="button"
                    className="dropdown-item py-1 px-2 rounded mb-1 text-start"
                    onClick={() => {
                      setShowMoveMenu(false);
                      onEdit(task);
                    }}
                  >
                    Edit Task
                  </button>
                  <div className="border-top my-1" />
                  <div className="text-muted px-2 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                    MOVE TO:
                  </div>
                  {COLUMNS.map((col) => {
                    if (col.id === task.status) return null;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        className="dropdown-item py-1 px-2 rounded text-start"
                        onClick={() => {
                          setShowMoveMenu(false);
                          onMoveTo(task, col.id);
                        }}
                      >
                        → {col.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="small fw-semibold text-truncate mb-2 cursor-pointer"
        style={{ cursor: 'pointer', color: 'var(--color-navy)' }}
        onClick={() => onEdit(task)}
      >
        {task.title}
      </div>

      <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2 mt-1">
        <span className="text-truncate" style={{ maxWidth: '120px' }}>
          {task.assigneeId?.name || 'Unassigned'}
        </span>
        <div className="d-flex align-items-center gap-1">
          {task.comments?.length > 0 && (
            <span className="d-flex align-items-center gap-1">
              <MessageSquare size={12} /> {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanBoard = (props) => {
  const {
    project,
    canManage = false,
    onRefresh = () => {}
  } = props;

  const tasks = props.tasks || project?.tasks || [];
  const teamMembers = props.teamMembers || project?.students || [];
  const workstreams = props.workstreams || project?.workstreams || [];
  const milestones = props.milestones || project?.milestones || [];

  const { user } = useAuth();
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const isGuideOrAdmin = canManage || (user?.roles || []).some((r) => ['guide', 'admin'].includes(r));
  const currentUserId = user?._id || user?.userId;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

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

  const handleMoveTo = async (task, targetStatus) => {
    setError(null);
    try {
      await api.patch(`/tasks/${task._id}`, { status: targetStatus });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || `Cannot transition task to '${targetStatus}'. Transition rule violation.`);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Check if dropped over a column or another card in a column
    let targetStatus = over.id;
    if (!COLUMNS.some((c) => c.id === targetStatus)) {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (task.status !== targetStatus && COLUMNS.some((c) => c.id === targetStatus)) {
      await handleMoveTo(task, targetStatus);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
          Interactive Kanban Board (5 Columns)
        </h6>
        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={handleOpenCreate}
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="row g-3 overflow-x-auto flex-nowrap pb-3" style={{ minHeight: '520px' }}>
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);

            return (
              <div key={column.id} className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: '240px' }}>
                <div
                  className="card shadow-none h-100 p-2 border bg-light"
                  style={{ borderTop: `3px solid ${column.color}` }}
                >
                  <div className="d-flex justify-content-between align-items-center p-2 mb-2">
                    <span className="small fw-bold text-uppercase" style={{ color: column.color, fontSize: '0.78rem' }}>
                      {column.label}
                    </span>
                    <span className="badge bg-white text-secondary border">
                      {columnTasks.length}
                    </span>
                  </div>

                  <SortableContext
                    id={column.id}
                    items={columnTasks.map((t) => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '200px' }}>
                      {columnTasks.map((t) => (
                        <KanbanCard
                          key={t._id}
                          task={t}
                          onEdit={handleOpenEdit}
                          onMoveTo={handleMoveTo}
                          isGuideOrAdmin={isGuideOrAdmin}
                          currentUserId={currentUserId}
                        />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-4 text-muted small border-dashed rounded my-auto">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>

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

export default KanbanBoard;
