import React, { useState, useEffect } from 'react';
import { History, User, Clock, Filter } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../common/Spinner';

const ProjectActivity = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/activity`);
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to load activity log', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filter === 'ALL') return true;
    return act.entity?.toUpperCase() === filter.toUpperCase();
  });

  if (loading) {
    return (
      <div className="pa-card text-center py-5">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pa-card">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <History size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Project Audit Activity Log</h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Tamper-proof chronological trail of all project events, status changes, and submissions.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Filter size={16} className="text-muted" />
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Entities</option>
            <option value="TASK">Tasks</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="DOCUMENT">Documents</option>
            <option value="REVIEW">Reviews</option>
            <option value="MILESTONE">Milestones</option>
            <option value="PROGRESS_REPORT">Weekly Reports</option>
          </select>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-5 text-muted">
          No activity recorded yet for this project.
        </div>
      ) : (
        <div className="position-relative ps-3" style={{ borderLeft: '2px solid var(--color-border)' }}>
          {filteredActivities.map((act, index) => (
            <div key={act.logId || index} className="position-relative mb-4 ps-3">
              {/* Dot */}
              <div
                className="position-absolute rounded-circle bg-white border border-2 border-primary"
                style={{
                  width: '12px',
                  height: '12px',
                  left: '-23px',
                  top: '5px'
                }}
              />

              <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
                <div>
                  <span className="badge bg-light text-dark border me-2" style={{ fontSize: '0.72rem' }}>
                    {act.entity}
                  </span>
                  <span className="fw-semibold text-dark">{act.action}</span>
                </div>
                <div className="text-muted small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  <Clock size={12} />
                  <span>{new Date(act.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-muted small mb-1 mt-1">{act.description}</p>

              {act.actor && (
                <div className="text-muted small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  <User size={12} />
                  <span>By {act.actor.name || 'System'} ({act.actor.role || 'System'})</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectActivity;
