import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  FolderGit2,
  Award,
  Bell,
  Settings,
  UserCheck,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const AdminDashboard = () => {
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
      console.error('Failed to load admin dashboard', err);
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
    totalUsersCount = 0,
    pendingRegistrationsCount = 0,
    totalProjectsCount = 0,
    departmentsCount = 0,
    usersByRole = {},
    projectsByStatus = {},
    pendingRegistrations = [],
    recentActivity = []
  } = data || {};

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">System Administration Console</h2>
        <p className="text-muted small mb-0">
          Institution-wide overview of academic departments, faculty allocations, account approvals, and platform audit trail.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Total Accounts"
            value={totalUsersCount}
            icon={Users}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Pending Registrations"
            value={pendingRegistrationsCount}
            icon={UserCheck}
            color={pendingRegistrationsCount > 0 ? 'warning' : 'secondary'}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Registered Projects"
            value={totalProjectsCount}
            icon={FolderGit2}
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Academic Departments"
            value={departmentsCount}
            icon={Building}
            color="info"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Pending Approvals */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <UserCheck size={18} className="text-warning" />
                <h5 className="mb-0 fw-bold">Faculty Registrations Pending Approval</h5>
              </div>
              <Link to="/admin/users" className="btn btn-sm btn-outline-primary">
                Manage Users
              </Link>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                All faculty and guide self-registrations have been approved.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pendingRegistrations.map((u) => (
                  <div key={u.userId} className="border rounded p-3 bg-light d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{u.name}</div>
                      <div className="text-muted small">{u.email}</div>
                      <div className="small text-muted mt-1">
                        Roles Requested: <span className="badge bg-secondary">{u.roles?.join(', ')}</span>
                      </div>
                    </div>
                    <Link to="/admin/users" className="btn btn-sm btn-primary">
                      Review Account
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Users by Role</h5>
            <div className="row g-2 text-center">
              {['student', 'guide', 'hod', 'panel', 'admin'].map((role) => (
                <div key={role} className="col-4">
                  <div className="p-3 bg-light rounded border">
                    <div className="fs-4 fw-bold text-dark">{usersByRole[role] || 0}</div>
                    <div className="text-muted small text-uppercase">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects by Status */}
      <div className="pa-card">
        <h5 className="fw-bold mb-3 border-bottom pb-2">Institution-Wide Projects by Status</h5>
        <div className="row g-3 text-center">
          {['Active', 'On Hold', 'Final Submitted', 'Under Evaluation', 'Completed', 'Cancelled'].map((st) => (
            <div key={st} className="col-6 col-md-4 col-lg-2">
              <div className="p-3 bg-light rounded border">
                <div className="fs-4 fw-bold text-primary">{projectsByStatus[st] || 0}</div>
                <div className="text-muted small mt-1">{st}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
