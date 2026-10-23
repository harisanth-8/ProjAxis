import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileCheck, Calendar, Clock, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const PanelDashboard = () => {
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
      console.error('Failed to load panel dashboard', err);
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
    assignedReviewsCount = 0,
    evaluationsPendingSubmissionCount = 0,
    upcomingReviews = [],
    pendingEvaluations = []
  } = data || {};

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Review Panel Member Dashboard</h2>
        <p className="text-muted small mb-0">
          Conduct scheduled project evaluations, assess student defenses against rubrics, and submit official marks.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <MetricCard
            title="Assigned Reviews"
            value={assignedReviewsCount}
            icon={Award}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <MetricCard
            title="Evaluations Pending"
            value={evaluationsPendingSubmissionCount}
            icon={FileCheck}
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <MetricCard
            title="Upcoming Sessions"
            value={upcomingReviews.length}
            icon={Calendar}
            color="success"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Pending Evaluations */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <FileCheck size={18} className="text-warning" />
                <h5 className="mb-0 fw-bold">Rubric Evaluations Needing Your Marks</h5>
              </div>
              <Link to="/panel/assigned-projects" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>

            {pendingEvaluations.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                All assigned evaluations have been scored and submitted!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pendingEvaluations.map((ev) => (
                  <div key={ev.evaluationId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-secondary">{ev.evaluationId}</span>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div className="fw-bold text-dark mt-1">Review: {ev.reviewType}</div>
                    <div className="text-muted small mb-2">
                      Project: {typeof ev.projectId === 'object' && ev.projectId !== null ? ev.projectId.projectId || ev.projectId.title : ev.projectId}
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        Session Date: {new Date(ev.reviewDate).toLocaleDateString()}
                      </span>
                      <Link to={`/panel/evaluations/${ev.reviewId}`} className="btn btn-sm btn-primary">
                        Enter Scores
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Review Sessions */}
        <div className="col-12 col-lg-6">
          <div className="pa-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div className="d-flex align-items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h5 className="mb-0 fw-bold">Assigned Upcoming Review Sessions</h5>
              </div>
              <Link to="/panel/assigned-projects" className="btn btn-sm btn-outline-primary">
                Manage
              </Link>
            </div>

            {upcomingReviews.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No upcoming evaluation sessions currently on your schedule.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {upcomingReviews.map((rev) => (
                  <div key={rev.reviewId} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="fw-bold text-dark">{rev.reviewType}</span>
                      <StatusBadge status={rev.status} />
                    </div>
                    <div className="text-muted small mb-1">
                      Project: {typeof rev.projectId === 'object' && rev.projectId !== null ? rev.projectId.projectId || rev.projectId.title : rev.projectId}
                    </div>
                    <div className="small text-muted d-flex align-items-center gap-2 mb-2">
                      <Clock size={12} />
                      <span>{new Date(rev.reviewDate).toLocaleString()}</span>
                      <MapPin size={12} />
                      <span>{rev.venue}</span>
                    </div>
                    <div className="d-flex justify-content-end pt-2 border-top">
                      <Link to={`/panel/evaluations/${rev.reviewId}`} className="btn btn-sm btn-outline-primary">
                        Open Evaluation Sheet
                      </Link>
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

export default PanelDashboard;
