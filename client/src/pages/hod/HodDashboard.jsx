import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  FileCheck,
  Award,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Spinner from '../../components/common/Spinner';

const HodDashboard = () => {
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
      console.error('Failed to load HOD dashboard', err);
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
    totalProjectsCount = 0,
    pendingAllocationsCount = 0,
    pendingTopicApprovalsCount = 0,
    weeklyReportComplianceRate = 0,
    upcomingReviewsCount = 0,
    guideWorkloads = [],
    pendingAllocations = [],
    pendingApprovals = []
  } = data || {};

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Department Head Dashboard</h2>
        <p className="text-muted small mb-0">
          Department-wide oversight of final year projects, guide allocations, topic approvals, and evaluation milestones.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Total Projects"
            value={totalProjectsCount}
            icon={FolderGit2}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Pending Guide Allocations"
            value={pendingAllocationsCount}
            icon={Users}
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Pending Topic Approvals"
            value={pendingTopicApprovalsCount}
            icon={FileCheck}
            color="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Weekly Compliance"
            value={`${weeklyReportComplianceRate}%`}
            icon={CheckCircle2}
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <MetricCard
            title="Upcoming Reviews"
            value={upcomingReviewsCount}
            icon={Award}
            color="secondary"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Pending Guide Allocations */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <Users size={18} className="text-warning" />
                <h5 className="mb-0 fw-bold">Proposals Awaiting Guide Allocation</h5>
              </div>
              <Link to="/hod/allocations" className="btn btn-sm btn-outline-primary">
                Allocate All
              </Link>
            </div>

            {pendingAllocations.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                All submitted student proposals have assigned guides.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pendingAllocations.map((prop) => (
                  <div key={prop.proposalId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-secondary">{prop.proposalId}</span>
                      <StatusBadge status={prop.approvalStatus} />
                    </div>
                    <div className="fw-bold text-dark mt-1">{prop.title}</div>
                    <div className="text-muted small mb-2">Domain: {prop.domain}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        Preferred Mentor: {prop.mentorChoices?.[0]?.guideName || 'None specified'}
                      </span>
                      <Link to="/hod/allocations" className="btn btn-sm btn-primary">
                        Assign Guide
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Final Topic Approvals */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <FileCheck size={18} className="text-info" />
                <h5 className="mb-0 fw-bold">Topic Approvals (Guide Endorsed)</h5>
              </div>
              <Link to="/hod/topic-approvals" className="btn btn-sm btn-outline-primary">
                Review All
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No guide-approved proposals awaiting department topic sanction.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pendingApprovals.map((prop) => (
                  <div key={prop.proposalId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-secondary">{prop.proposalId}</span>
                      <StatusBadge status={prop.approvalStatus} />
                    </div>
                    <div className="fw-bold text-dark mt-1">{prop.title}</div>
                    <div className="text-muted small mb-2">Guide: {prop.assignedGuide?.name || 'Guide'}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        Endorsed by Guide on {new Date(prop.updatedAt || prop.submissionDate).toLocaleDateString()}
                      </span>
                      <Link to="/hod/topic-approvals" className="btn btn-sm btn-success">
                        Sanction Topic
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guide Workload Overview */}
        <div className="col-12">
          <div className="pa-card">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h5 className="mb-0 fw-bold">Department Faculty Supervision Workload</h5>
              </div>
              <Link to="/hod/reports" className="btn btn-sm btn-outline-primary">
                Full Workload Report
              </Link>
            </div>

            {guideWorkloads.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No faculty guide workloads recorded.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Faculty Guide</th>
                      <th>Email</th>
                      <th className="text-center">Active Projects</th>
                      <th className="text-center">Capacity Limit</th>
                      <th style={{ width: '220px' }}>Capacity Utilization</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guideWorkloads.map((gw) => {
                      const limit = gw.capacityLimit || 8;
                      const active = gw.activeProjectsCount || 0;
                      const percent = Math.min(100, Math.round((active / limit) * 100));
                      const isAtCap = active >= limit;

                      return (
                        <tr key={gw.guideId || gw.email}>
                          <td>
                            <div className="fw-bold text-dark">{gw.name}</div>
                            <div className="text-muted small">{gw.facultyId || 'Faculty'}</div>
                          </td>
                          <td className="text-muted small">{gw.email}</td>
                          <td className="text-center fw-bold">{active}</td>
                          <td className="text-center text-muted">{limit}</td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div className="d-flex justify-content-between small text-muted" style={{ fontSize: '0.72rem' }}>
                                <span>{active} of {limit} teams</span>
                                <span>{percent}%</span>
                              </div>
                              <ProgressBar
                                progress={percent}
                                height={6}
                                color={isAtCap ? 'danger' : percent > 75 ? 'warning' : 'primary'}
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            {isAtCap ? (
                              <span className="badge bg-danger-subtle text-danger border">At Capacity</span>
                            ) : (
                              <span className="badge bg-success-subtle text-success border">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

export default HodDashboard;
