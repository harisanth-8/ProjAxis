import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  FileText,
  Clock,
  Award,
  AlertCircle,
  Eye,
  CheckCircle,
  Calendar,
  Users
} from 'lucide-react';
import api from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const GuideDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load guide dashboard', err);
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

  const {
    assignedTeamsCount = 0,
    pendingProposalsCount = 0,
    reportsAwaitingFeedbackCount = 0,
    tasksAwaitingReviewCount = 0,
    overdueTasksCount = 0,
    upcomingReviewsCount = 0,
    recentProposals = [],
    reportsAwaitingFeedback = [],
    upcomingReviews = []
  } = data || {};

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Guide Dashboard</h2>
        <p className="text-muted small mb-0">
          Supervise assigned student teams, review project abstracts, monitor weekly progress, and manage reviews.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Supervised Teams"
            value={assignedTeamsCount}
            icon={FolderGit2}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Pending Proposals"
            value={pendingProposalsCount}
            icon={FileText}
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Reports Need Feedback"
            value={reportsAwaitingFeedbackCount}
            icon={Eye}
            color="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Tasks Under Review"
            value={tasksAwaitingReviewCount}
            icon={CheckCircle}
            color="secondary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Overdue Tasks"
            value={overdueTasksCount}
            icon={AlertCircle}
            color="danger"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Upcoming Reviews"
            value={upcomingReviewsCount}
            icon={Award}
            color="success"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Proposals Awaiting Review */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <FileText size={18} className="text-warning" />
                <h5 className="mb-0 fw-bold">Proposals Awaiting Your Decision</h5>
              </div>
              <Link to="/guide/proposals" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>

            {recentProposals.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No pending proposals waiting for your review.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recentProposals.map((prop) => (
                  <div key={prop.proposalId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-secondary px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        {prop.proposalId}
                      </span>
                      <StatusBadge status={prop.approvalStatus} />
                    </div>
                    <div className="fw-bold text-dark mt-1">{prop.title}</div>
                    <p className="text-muted small mb-2 text-truncate">{prop.problemStatement}</p>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        Submitted: {new Date(prop.submissionDate).toLocaleDateString()}
                      </span>
                      <Link to={`/guide/proposals?id=${prop.proposalId}`} className="btn btn-sm btn-primary">
                        Review Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Reports Needing Feedback */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <Eye size={18} className="text-info" />
                <h5 className="mb-0 fw-bold">Weekly Reports Awaiting Feedback</h5>
              </div>
              <Link to="/guide/teams" className="btn btn-sm btn-outline-primary">
                My Teams
              </Link>
            </div>

            {reportsAwaitingFeedback.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                All submitted weekly reports have been reviewed!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reportsAwaitingFeedback.map((rep) => (
                  <div key={rep.reportId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <span className="fw-bold text-dark">Week {rep.weekNo} Progress Report</span>
                        <div className="text-muted small">
                          Project: {typeof rep.projectId === 'object' && rep.projectId !== null ? rep.projectId.projectId || rep.projectId.title : rep.projectId}
                        </div>
                      </div>
                      <StatusBadge status={rep.status} />
                    </div>
                    <div className="small text-muted mb-2">
                      <strong>Work Done:</strong> {rep.workDone}
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="badge bg-light text-dark border">
                        Reported Progress: {rep.progress}%
                      </span>
                      <Link
                        to={`/projects/${typeof rep.projectId === 'object' && rep.projectId !== null ? rep.projectId.projectId || rep.projectId._id : rep.projectId}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Give Feedback
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reviews */}
        <div className="col-12">
          <div className="pa-card">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <Award size={18} className="text-success" />
                <h5 className="mb-0 fw-bold">Upcoming Project Reviews</h5>
              </div>
              <Link to="/guide/reviews" className="btn btn-sm btn-primary">
                Schedule Review
              </Link>
            </div>

            {upcomingReviews.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No reviews scheduled in the near future.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Review Type</th>
                      <th>Project</th>
                      <th>Date & Time</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingReviews.map((rev) => (
                      <tr key={rev.reviewId}>
                        <td className="fw-bold text-dark">{rev.reviewType}</td>
                        <td>
                          {typeof rev.projectId === 'object' && rev.projectId !== null
                            ? rev.projectId.projectId || rev.projectId.title
                            : String(rev.projectId || 'N/A')}
                        </td>
                        <td className="text-muted small">
                          {new Date(rev.reviewDate).toLocaleString()}
                        </td>
                        <td>{rev.venue}</td>
                        <td>
                          <StatusBadge status={rev.status} />
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/guide/reviews`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;
