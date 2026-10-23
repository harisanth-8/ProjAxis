import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import MetricCard from '../../components/common/MetricCard';
import { UserCheck, Users, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const AddMentor = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/guides')
      .then((res) => setGuides(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner message="Loading faculty mentors..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Faculty Guide Directory</h4>
          <div className="text-muted small">
            Review available project supervisors, active project counts, and institutional capacity caps
          </div>
        </div>
        <Link to="/student/submit-proposal" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          Apply in Proposal <ArrowRight size={15} />
        </Link>
      </div>

      <div className="row g-4">
        {guides.map((guide) => (
          <div key={guide._id} className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-none h-100 p-4 border">
              <div className="d-flex align-items-start gap-3 mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-navy)' }}
                >
                  {guide.name?.charAt(0) || 'G'}
                </div>
                <div className="overflow-hidden">
                  <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--color-navy)' }}>
                    {guide.name}
                  </h6>
                  <div className="small text-muted">{guide.facultyId || 'Faculty Member'}</div>
                  <div className="small text-muted text-truncate">{guide.email}</div>
                </div>
              </div>

              <div className="p-3 bg-light rounded mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Current Supervised Projects:</span>
                  <span className="small fw-bold">
                    {guide.activeProjectCount} / {guide.capacityCap}
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar ${guide.hasCapacity ? 'bg-primary' : 'bg-danger'}`}
                    style={{ width: `${Math.min(100, (guide.activeProjectCount / guide.capacityCap) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                <span className={`badge ${guide.hasCapacity ? 'bg-success' : 'bg-danger'}`}>
                  {guide.hasCapacity ? 'Capacity Available' : 'At Capacity Cap'}
                </span>
                <Link to="/student/submit-proposal" className="btn btn-outline-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                  Select in Proposal
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddMentor;
