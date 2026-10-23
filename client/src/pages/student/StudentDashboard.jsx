import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  FileText
} from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner message="Loading student dashboard..." />;

  const {
    proposals = [],
    activeProject,
    computedMetrics,
    openTasks = [],
    nextReview,
    missingWeeklyReport,
    recentFeedback = []
  } = data || {};

  const latestProposal = proposals[0];

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Student Academic Dashboard</h4>
          <div className="text-muted small">Monitor proposal milestones, weekly progress reports, tasks, and reviews</div>
        </div>
        <div className="d-flex gap-2">
          {!activeProject && (
            <Link to="/student/submit-proposal" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <FileText size={16} /> Submit Proposal
            </Link>
          )}
          {activeProject && missingWeeklyReport && (
            <Link to={`/student/projects/${activeProject._id}/report`} className="btn btn-warning btn-sm text-dark d-flex align-items-center gap-1">
              <Clock size={16} /> Submit Weekly Report
            </Link>
          )}
        </div>
      </div>

      {/* Missing Weekly Report Urgent Alert */}
      {activeProject && missingWeeklyReport && (
        <div className="alert alert-warning border-warning shadow-none mb-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={20} className="text-warning flex-shrink-0" />
            <div>
              <span className="fw-bold">Weekly Progress Report Due: </span>
              Your project team has not yet submitted the weekly progress update for the current week.
            </div>
          </div>
          <Link to={`/student/projects/${activeProject._id}/report`} className="btn btn-sm btn-dark text-nowrap ms-2">
            Submit Now
          </Link>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <MetricCard
            title="Proposal Status"
            value={latestProposal ? latestProposal.approvalStatus : 'None'}
            subtext={latestProposal ? `ID: ${latestProposal.proposalId}` : 'No proposal submitted yet'}
            icon={FileText}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <MetricCard
            title="Project State"
            value={activeProject ? activeProject.status : 'No Project'}
            subtext={activeProject ? `Guide: ${activeProject.guideId?.name || 'Assigned'}` : 'Requires approved topic'}
            icon={FolderGit2}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <MetricCard
            title="Task Progress"
            value={computedMetrics ? computedMetrics.taskProgress : 'No tasks yet'}
            subtext={computedMetrics ? `${computedMetrics.doneTasks} of ${computedMetrics.totalTasks} completed` : 'Awaiting project activation'}
            icon={CheckCircle2}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <MetricCard
            title="Reported Progress"
            value={computedMetrics ? computedMetrics.reportedProgress : '0%'}
            subtext="From latest weekly submission"
            icon={Clock}
          />
        </div>
      </div>

      {/* Main Grid: Project Overview & Tasks */}
      <div className="row g-4">
        {/* Left Column: Active Project or Proposals */}
        <div className="col-12 col-lg-8">
          {activeProject ? (
            <div className="card shadow-none p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="small text-muted fw-bold">{activeProject.projectId}</span>
                    <StatusBadge status={activeProject.status} />
                  </div>
                  <h5 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>
                    {activeProject.title}
                  </h5>
                  <div className="small text-muted">{activeProject.domain}</div>
                </div>
                <Link to={`/student/projects/${activeProject._id}`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                  Project Workspace <ArrowRight size={15} />
                </Link>
              </div>

              <div className="p-3 bg-light rounded mb-3">
                <div className="row g-2 text-center text-sm-start">
                  <div className="col-12 col-sm-4">
                    <div className="small text-muted">Project Guide</div>
                    <div className="fw-semibold small">{activeProject.guideId?.name || 'Assigned'}</div>
                  </div>
                  <div className="col-12 col-sm-4">
                    <div className="small text-muted">Academic Year</div>
                    <div className="fw-semibold small">{activeProject.academicYear}</div>
                  </div>
                  <div className="col-12 col-sm-4">
                    <div className="small text-muted">Department</div>
                    <div className="fw-semibold small">{activeProject.departmentId?.name}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <ProgressBar
                    value={computedMetrics?.taskProgress}
                    label="Task Progress (Computed from Done Tasks)"
                    subtext={computedMetrics?.taskProgress}
                    color="var(--color-navy)"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <ProgressBar
                    value={computedMetrics?.reportedProgress}
                    label="Reported Progress (Latest Weekly Report)"
                    subtext={computedMetrics?.reportedProgress}
                    color="var(--color-academic-blue)"
                  />
                </div>
              </div>
            </div>
          ) : latestProposal ? (
            <div className="card shadow-none p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="small text-muted fw-bold">{latestProposal.proposalId}</span>
                  <h5 className="fw-bold mt-1" style={{ color: 'var(--color-navy)' }}>
                    {latestProposal.title}
                  </h5>
                </div>
                <StatusBadge status={latestProposal.approvalStatus} />
              </div>
              <p className="small text-secondary mb-3">{latestProposal.problemStatement}</p>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <span className="small text-muted">
                  Domain: <strong>{latestProposal.domain}</strong>
                </span>
                <Link to={`/student/proposals/${latestProposal._id}`} className="btn btn-outline-primary btn-sm">
                  View Full Abstract
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Project or Proposal Found"
              description="You have not created or submitted a project proposal for this academic session."
              actionLabel="Submit Project Proposal"
              onAction={() => window.location.href = '/student/submit-proposal'}
            />
          )}

          {/* Open Tasks List */}
          <div className="card shadow-none p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ color: 'var(--color-navy)' }}>
                My Assigned Tasks ({openTasks.length})
              </h6>
              {activeProject && (
                <Link to={`/student/projects/${activeProject._id}`} className="small text-decoration-none">
                  View Kanban Board
                </Link>
              )}
            </div>

            {openTasks.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No pending tasks assigned to you.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-sm">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTasks.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <div className="fw-medium small">{t.title}</div>
                          <div className="text-muted text-xs" style={{ fontSize: '0.75rem' }}>{t.taskId}</div>
                        </td>
                        <td><StatusBadge status={t.priority} /></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td className="small text-muted">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Unscheduled'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Next Review & Recent Feedback */}
        <div className="col-12 col-lg-4">
          {/* Upcoming Review */}
          <div className="card shadow-none p-4 mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <Calendar size={18} /> Next Scheduled Review
            </h6>
            {nextReview ? (
              <div className="p-3 bg-light rounded border">
                <div className="badge bg-primary mb-2">{nextReview.reviewType}</div>
                <div className="fw-bold small mb-1">
                  {new Date(nextReview.reviewDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="small text-muted mb-2">Venue: {nextReview.venue}</div>
                {nextReview.instructions && (
                  <div className="small text-secondary border-top pt-2">
                    {nextReview.instructions}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted small text-center py-3">
                No upcoming review scheduled.
              </div>
            )}
          </div>

          {/* Recent Guide Feedback */}
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <MessageSquare size={18} /> Recent Feedback
            </h6>
            {recentFeedback.length === 0 ? (
              <div className="text-muted small text-center py-3">
                No feedback received yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recentFeedback.map((fb) => (
                  <div key={fb._id} className="p-3 bg-light rounded border-start border-3 border-primary">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-semibold">{fb.authorId?.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {new Date(fb.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="small text-secondary">{fb.comments}</div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                      Target: {fb.targetType}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
