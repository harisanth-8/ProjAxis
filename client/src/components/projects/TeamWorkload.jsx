import React from 'react';
import { Users, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';

const TeamWorkload = ({ project }) => {
  const students = project.students || [];
  const tasks = project.tasks || [];

  const totalAssignedTasks = tasks.filter((t) => t.assigneeId).length;
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  // Compute stats per student
  const memberStats = students.map((member) => {
    const memberTasks = tasks.filter((t) => {
      const assigneeId = typeof t.assigneeId === 'object' ? t.assigneeId?._id || t.assigneeId?.userId : t.assigneeId;
      const memId = member._id || member.userId;
      return assigneeId === memId;
    });

    const total = memberTasks.length;
    const done = memberTasks.filter((t) => t.status === 'Done').length;
    const open = memberTasks.filter((t) => t.status === 'To Do' || t.status === 'In Progress' || t.status === 'Blocked').length;
    const awaitingReview = memberTasks.filter((t) => t.status === 'Under Review').length;
    const overdue = memberTasks.filter((t) => {
      if (t.status === 'Done') return false;
      return t.dueDate && new Date(t.dueDate) < now;
    }).length;

    const upcoming = memberTasks.filter((t) => {
      if (t.status === 'Done') return false;
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= next7Days;
    }).length;

    const taskSharePercent = totalAssignedTasks > 0 ? Math.round((total / totalAssignedTasks) * 100) : 0;
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      member,
      total,
      open,
      done,
      awaitingReview,
      overdue,
      upcoming,
      taskSharePercent,
      completionPercent
    };
  });

  return (
    <div className="pa-card">
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Users size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Team Workload Distribution</h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Task distribution and performance indicators across all team members.
          </p>
        </div>
        <div className="badge bg-light text-dark border px-3 py-2">
          Total Assigned Tasks: <span className="fw-bold">{totalAssignedTasks}</span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead className="table-light">
            <tr>
              <th>Team Member</th>
              <th className="text-center">Share of Tasks</th>
              <th className="text-center">Assigned</th>
              <th className="text-center">Open</th>
              <th className="text-center">Under Review</th>
              <th className="text-center">Done</th>
              <th className="text-center">Overdue</th>
              <th className="text-center">Due in 7 Days</th>
              <th style={{ width: '180px' }}>Task Progress</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map(({ member, total, open, done, awaitingReview, overdue, upcoming, taskSharePercent, completionPercent }) => (
              <tr key={member.userId || member._id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold"
                      style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-navy)' }}
                    >
                      {member.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{member.name}</div>
                      <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                        {member.studentProfile?.regNo || member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span className="badge bg-secondary-subtle text-secondary border">
                    {total} / {totalAssignedTasks} ({taskSharePercent}%)
                  </span>
                </td>
                <td className="text-center fw-bold">{total}</td>
                <td className="text-center">
                  <span className={`fw-medium ${open > 0 ? 'text-primary' : 'text-muted'}`}>{open}</span>
                </td>
                <td className="text-center">
                  {awaitingReview > 0 ? (
                    <span className="badge bg-warning-subtle text-warning border d-inline-flex align-items-center gap-1">
                      <Eye size={12} /> {awaitingReview}
                    </span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td className="text-center">
                  <span className={`fw-medium ${done > 0 ? 'text-success' : 'text-muted'}`}>{done}</span>
                </td>
                <td className="text-center">
                  {overdue > 0 ? (
                    <span className="badge bg-danger-subtle text-danger border d-inline-flex align-items-center gap-1">
                      <AlertCircle size={12} /> {overdue}
                    </span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td className="text-center">
                  {upcoming > 0 ? (
                    <span className="badge bg-info-subtle text-info border d-inline-flex align-items-center gap-1">
                      <Clock size={12} /> {upcoming}
                    </span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td>
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex justify-content-between text-muted small" style={{ fontSize: '0.72rem' }}>
                      <span>Done: {done}/{total}</span>
                      <span>{completionPercent}%</span>
                    </div>
                    <ProgressBar progress={completionPercent} height={6} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamWorkload;
