import React, { useMemo } from 'react';
import StatusBadge from '../common/StatusBadge';
import { Calendar, AlertCircle, Flag, Clock } from 'lucide-react';

const TimelineGantt = ({ project, tasks: propTasks, milestones: propMilestones }) => {
  const tasks = propTasks || project?.tasks || [];
  const milestones = propMilestones || project?.milestones || [];
  const now = new Date();

  // Find date range
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = project.startDate ? new Date(project.startDate) : new Date();
    let max = project.endDate ? new Date(project.endDate) : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    for (const t of tasks) {
      if (t.startDate && new Date(t.startDate) < min) min = new Date(t.startDate);
      if (t.dueDate && new Date(t.dueDate) > max) max = new Date(t.dueDate);
    }

    for (const m of milestones) {
      if (m.dueDate && new Date(m.dueDate) > max) max = new Date(m.dueDate);
      if (m.dueDate && new Date(m.dueDate) < min) min = new Date(m.dueDate);
    }

    const diffDays = Math.max(30, Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 5);
    return { minDate: min, maxDate: max, totalDays: diffDays };
  }, [project, tasks, milestones]);

  // Compute overdue, dependency not done, and overlapping due dates
  const taskAnalysis = useMemo(() => {
    const analysis = {};
    const assigneeDueMap = {};

    for (const t of tasks) {
      const isOverdue = t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now;

      // Check dependencies
      let dependencyBlocking = false;
      if (t.dependsOn && t.dependsOn.length > 0) {
        for (const depId of t.dependsOn) {
          const parentTask = tasks.find((item) => item.taskId === depId);
          if (parentTask && parentTask.status !== 'Done') {
            dependencyBlocking = true;
            break;
          }
        }
      }

      // Check overlap
      let hasOverlap = false;
      if (t.assigneeId?._id && t.dueDate) {
        const dateStr = new Date(t.dueDate).toISOString().split('T')[0];
        const key = `${t.assigneeId._id}-${dateStr}`;
        if (assigneeDueMap[key]) {
          hasOverlap = true;
          assigneeDueMap[key].push(t.taskId);
        } else {
          assigneeDueMap[key] = [t.taskId];
        }
      }

      analysis[t._id] = {
        isOverdue,
        dependencyBlocking,
        hasOverlap
      };
    }

    return analysis;
  }, [tasks]);

  const getPositionPercent = (date) => {
    if (!date) return 0;
    const current = new Date(date);
    const diff = current - minDate;
    const total = maxDate - minDate;
    return Math.max(0, Math.min(100, (diff / total) * 100));
  };

  const todayPercent = getPositionPercent(now);

  return (
    <div className="card shadow-none p-4 border">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
            Project Gantt Timeline
          </h6>
          <div className="small text-muted">
            Tracking duration, milestones, dependency blockers, and schedule overlaps
          </div>
        </div>

        {/* Legend */}
        <div className="d-flex flex-wrap gap-2 small">
          <span className="badge bg-light text-dark border">
            Today: {now.toLocaleDateString()}
          </span>
          <span className="badge bg-danger">Overdue Task</span>
          <span className="badge bg-warning text-dark">Unsatisfied Dependency</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '700px', position: 'relative' }}>
          {/* Header Dates Bar */}
          <div className="d-flex justify-content-between small text-muted border-bottom pb-2 mb-3">
            <span>{minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="fw-bold" style={{ color: 'var(--color-academic-blue)' }}>
              Project Schedule Window ({totalDays} Days)
            </span>
            <span>{maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Today Line Indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${todayPercent}%`,
              top: '30px',
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--color-error)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
            title="Today"
          >
            <div
              className="badge bg-danger rounded-pill"
              style={{
                position: 'absolute',
                top: '-18px',
                left: '-24px',
                fontSize: '0.65rem'
              }}
            >
              Today
            </div>
          </div>

          {/* Milestones on Timeline */}
          {milestones.length > 0 && (
            <div className="mb-4">
              <div className="small text-uppercase fw-bold text-muted mb-2">Project Milestones</div>
              {milestones.map((ms) => {
                const pos = getPositionPercent(ms.dueDate);
                return (
                  <div key={ms._id} className="position-relative py-2 border-bottom">
                    <div className="d-flex align-items-center gap-2 small mb-1">
                      <Flag size={14} className="text-primary" />
                      <span className="fw-semibold">{ms.title}</span>
                      <StatusBadge status={ms.status} />
                    </div>
                    <div
                      className="position-relative bg-light rounded"
                      style={{ height: '14px' }}
                    >
                      <div
                        className="position-absolute"
                        style={{
                          left: `${pos}%`,
                          top: '-4px',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div
                          className={`badge ${ms.status === 'Achieved' ? 'bg-success' : 'bg-primary'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          ◆ {new Date(ms.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks Bars on Timeline */}
          <div>
            <div className="small text-uppercase fw-bold text-muted mb-2">Project Tasks</div>
            {tasks.map((task) => {
              const start = task.startDate ? getPositionPercent(task.startDate) : getPositionPercent(task.createdAt);
              const end = task.dueDate ? getPositionPercent(task.dueDate) : Math.min(100, start + 10);
              const width = Math.max(4, end - start);
              const flags = taskAnalysis[task._id] || {};

              return (
                <div key={task._id} className="py-2 border-bottom">
                  <div className="d-flex justify-content-between align-items-center small mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold" style={{ color: 'var(--color-navy)' }}>
                        {task.taskId}
                      </span>
                      <span className="text-truncate" style={{ maxWidth: '280px' }}>
                        {task.title}
                      </span>
                      <StatusBadge status={task.status} />

                      {flags.isOverdue && (
                        <span className="badge bg-danger" title="Task is past due date">
                          Overdue
                        </span>
                      )}
                      {flags.dependencyBlocking && (
                        <span className="badge bg-warning text-dark" title="Parent dependency task is not completed">
                          Dependency Blocked
                        </span>
                      )}
                    </div>
                    <span className="text-muted small">
                      {task.assigneeId?.name || 'Unassigned'}
                    </span>
                  </div>

                  <div className="position-relative bg-light rounded" style={{ height: '18px' }}>
                    <div
                      className="position-absolute rounded"
                      style={{
                        left: `${start}%`,
                        width: `${width}%`,
                        height: '100%',
                        backgroundColor: flags.isOverdue
                          ? 'var(--color-error)'
                          : task.status === 'Done'
                          ? 'var(--color-success)'
                          : 'var(--color-academic-blue)',
                        opacity: 0.85
                      }}
                      title={`${task.title} (${task.status})`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineGantt;
