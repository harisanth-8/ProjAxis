import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import MetricCard from '../common/MetricCard';
import ProgressBar from '../common/ProgressBar';
import StatusBadge from '../common/StatusBadge';
import Spinner from '../common/Spinner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Activity,
  Layers,
  Flag
} from 'lucide-react';

const STATUS_COLORS = {
  'To Do': '#64748B',
  'In Progress': '#2F65A7',
  'Under Review': '#C58B24',
  Blocked: '#C94C4C',
  Done: '#27856A'
};

const WorkspaceSummary = ({ projectId, project }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeProjectId = projectId || project?.projectId || project?._id;

  useEffect(() => {
    if (!activeProjectId) return;
    api.get(`/projects/${activeProjectId}/summary`)
      .then((res) => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  if (loading) return <Spinner message="Computing workspace metrics..." />;
  if (!summary) return <div className="text-muted p-4">Summary data unavailable.</div>;

  const {
    counters,
    taskProgress,
    reportedProgress,
    milestoneProgress,
    statusDistribution = [],
    priorityBreakdown = [],
    workstreamMetrics = [],
    upcomingDeadlines = [],
    recentActivity = []
  } = summary;

  const donutData = statusDistribution.map((item) => ({
    name: item._id,
    value: item.count
  }));

  const barData = priorityBreakdown.map((item) => ({
    priority: item._id,
    count: item.count
  }));

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Rolling 7-day Activity Counters */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <MetricCard
            title="Completed (7 Days)"
            value={counters.completedLast7Days}
            subtext="Tasks closed recently"
            icon={CheckCircle2}
            badgeColor="var(--color-success)"
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            title="Updated (7 Days)"
            value={counters.updatedLast7Days}
            subtext="Task modifications"
            icon={Activity}
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            title="Created (7 Days)"
            value={counters.createdLast7Days}
            subtext="New backlog items"
            icon={Layers}
          />
        </div>
        <div className="col-6 col-md-3">
          <MetricCard
            title="Due Soon (Next 7 Days)"
            value={counters.dueSoonNext7Days}
            subtext="Upcoming task deadlines"
            icon={Clock}
            badgeColor={counters.dueSoonNext7Days > 0 ? 'var(--color-warning)' : null}
          />
        </div>
      </div>

      {/* 2. Key Progress Measures (Both Labelled Clearly) */}
      <div className="card shadow-none p-4">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
          Project Progress Metrics
        </h6>
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <ProgressBar
              value={taskProgress}
              label="Task Progress (Done / All Tasks)"
              subtext={taskProgress}
              color="var(--color-navy)"
              height={10}
            />
          </div>
          <div className="col-12 col-md-4">
            <ProgressBar
              value={reportedProgress}
              label="Reported Progress (Latest Weekly Report)"
              subtext={reportedProgress}
              color="var(--color-academic-blue)"
              height={10}
            />
          </div>
          <div className="col-12 col-md-4">
            <ProgressBar
              value={milestoneProgress}
              label="Milestone Progress (Achieved / Total)"
              subtext={milestoneProgress}
              color="var(--color-success)"
              height={10}
            />
          </div>
        </div>
      </div>

      {/* 3. Visual Charts: Donut & Bar */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card shadow-none p-4 h-100">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
              Task Status Distribution
            </h6>
            {donutData.length === 0 ? (
              <div className="text-muted small text-center py-5">No tasks recorded yet.</div>
            ) : (
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || '#64748B'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
              {donutData.map((d) => (
                <div key={d.name} className="d-flex align-items-center gap-1 small text-muted">
                  <span
                    className="rounded-circle d-inline-block"
                    style={{ width: '8px', height: '8px', backgroundColor: STATUS_COLORS[d.name] || '#64748B' }}
                  />
                  <span>{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card shadow-none p-4 h-100">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
              Tasks by Priority
            </h6>
            {barData.length === 0 ? (
              <div className="text-muted small text-center py-5">No priority data yet.</div>
            ) : (
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--color-academic-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Workstreams Breakdown */}
      {workstreamMetrics.length > 0 && (
        <div className="card shadow-none p-4">
          <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
            Workstream Completion Status
          </h6>
          <div className="d-flex flex-column gap-3">
            {workstreamMetrics.map((ws) => (
              <div key={ws.workstreamId} className="p-3 bg-light rounded border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    <span className="small text-muted fw-bold me-2">{ws.workstreamId}</span>
                    <span className="small fw-semibold">{ws.title}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">
                      {ws.done} / {ws.total} done ({ws.percentage}%)
                    </span>
                    <StatusBadge status={ws.status} />
                  </div>
                </div>
                <div className="progress mt-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${ws.total ? (ws.done / ws.total) * 100 : 0}%` }}
                    title={`Done: ${ws.done}`}
                  />
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${ws.total ? (ws.inProgress / ws.total) * 100 : 0}%` }}
                    title={`In Progress: ${ws.inProgress}`}
                  />
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: `${ws.total ? (ws.todo / ws.total) * 100 : 0}%` }}
                    title={`To Do: ${ws.todo}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Upcoming Deadlines & Recent Activity */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card shadow-none p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <Clock size={18} /> Upcoming Task Deadlines
            </h6>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-muted small text-center py-4">No upcoming task deadlines.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {upcomingDeadlines.map((t) => (
                  <div key={t._id} className="p-2 border rounded d-flex justify-content-between align-items-center small">
                    <div>
                      <div className="fw-medium">{t.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Assignee: {t.assigneeId?.name || 'Unassigned'}
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-light text-dark border">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card shadow-none p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <Activity size={18} /> Recent Workspace Activity
            </h6>
            {recentActivity.length === 0 ? (
              <div className="text-muted small text-center py-4">No recent activity logged.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentActivity.map((act) => (
                  <div key={act._id} className="p-2 bg-light rounded small border-start border-3 border-primary">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold">{act.actor?.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-secondary">{act.description}</div>
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

export default WorkspaceSummary;
