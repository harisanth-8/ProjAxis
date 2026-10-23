import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Calendar, Award, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const StudentReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [selectedReviewDetails, setSelectedReviewDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentIdentifier = user?._id || user?.userId || 'me';
        const [revRes, attRes] = await Promise.all([
          api.get('/reviews').catch(() => ({ data: [] })),
          api.get(`/students/${studentIdentifier}/attendance`).catch(() => ({ data: null }))
        ]);
        setReviews(revRes.data || []);
        setAttendanceSummary(attRes.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id, user?.userId]);

  const handleViewReview = async (reviewId) => {
    try {
      const res = await api.get(`/reviews/${reviewId}`);
      setSelectedReviewDetails(res.data);
    } catch {
      // silent
    }
  };

  if (loading) return <Spinner message="Loading review schedules and evaluation marks..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Reviews, Attendance & Marks</h4>
          <div className="text-muted small">
            Review presentation schedules, official meeting attendance, and published evaluation results
          </div>
        </div>
      </div>

      {/* Attendance Summary Top Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <MetricCard
            title="Attendance Rate"
            value={attendanceSummary ? `${attendanceSummary.percentage}%` : '0%'}
            subtext={attendanceSummary ? attendanceSummary.summaryText : 'No reviews conducted yet'}
            icon={CheckCircle2}
          />
        </div>
        <div className="col-12 col-md-4">
          <MetricCard
            title="Scheduled Reviews"
            value={reviews.filter((r) => r.status === 'Scheduled').length}
            subtext="Upcoming departmental viva presentations"
            icon={Calendar}
          />
        </div>
        <div className="col-12 col-md-4">
          <MetricCard
            title="Completed Evaluations"
            value={reviews.filter((r) => r.status === 'Completed').length}
            subtext="Conducted review sessions"
            icon={Award}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Review Schedule & Attendance History */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-none p-4 mb-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
              Official Review Schedule
            </h6>

            {reviews.length === 0 ? (
              <EmptyState title="No Reviews Scheduled" description="No evaluation sessions have been assigned to your projects." />
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className={`p-3 rounded border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 ${
                      selectedReviewDetails?.review?._id === r._id ? 'border-primary bg-light' : 'bg-white'
                    }`}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-bold small" style={{ color: 'var(--color-navy)' }}>
                          {r.reviewType}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="small fw-semibold">{r.projectId?.title}</div>
                      <div className="small text-muted mt-1">
                        <Calendar size={13} className="me-1 inline" />
                        {new Date(r.reviewDate).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' | '}Venue: {r.venue}
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-primary text-nowrap align-self-start align-self-sm-center"
                      onClick={() => handleViewReview(r._id)}
                    >
                      View Details & Marks
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student's Personal Attendance Log */}
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
              My Attendance History (S9)
            </h6>
            {attendanceSummary?.history?.length === 0 ? (
              <div className="text-muted small text-center py-3">No attendance records logged yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-sm">
                  <thead>
                    <tr>
                      <th>Review Event</th>
                      <th>Date</th>
                      <th>Venue</th>
                      <th>Attendance</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary?.history?.map((h, i) => (
                      <tr key={i}>
                        <td className="fw-semibold small">{h.reviewType}</td>
                        <td className="small text-muted">{new Date(h.reviewDate).toLocaleDateString()}</td>
                        <td className="small text-muted">{h.venue}</td>
                        <td><StatusBadge status={h.status} /></td>
                        <td className="small text-muted">{h.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Review Details & Evaluation Marks (S10) */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-none p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--color-navy)' }}>
              Evaluation & Rubric Breakdown (S10)
            </h6>

            {!selectedReviewDetails ? (
              <div className="text-center py-5 text-muted small">
                Select a review from the schedule list to inspect venue instructions, panel evaluation criteria, and published marks.
              </div>
            ) : (
              <div>
                <div className="p-3 bg-light rounded mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold small">{selectedReviewDetails.review?.reviewType}</span>
                    <StatusBadge status={selectedReviewDetails.review?.status} />
                  </div>
                  <div className="small text-muted mb-2">Venue: {selectedReviewDetails.review?.venue}</div>
                  {selectedReviewDetails.review?.instructions && (
                    <div className="small text-secondary border-top pt-2">
                      <strong>Instructions:</strong> {selectedReviewDetails.review.instructions}
                    </div>
                  )}
                </div>

                {/* Published Evaluation Marks */}
                {selectedReviewDetails.evaluation ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-uppercase text-secondary">Official Published Result</span>
                      <StatusBadge status="Published" />
                    </div>

                    {selectedReviewDetails.evaluation.entries?.map((entry) => {
                      // Show student's own entry or all team members
                      const isMe = entry.studentId?._id?.toString() === user._id.toString();
                      return (
                        <div key={entry.studentId?._id || Math.random()} className={`p-3 rounded border mb-3 ${isMe ? 'bg-light border-primary' : 'bg-white'}`}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-bold small">{entry.studentId?.name} {isMe && '(You)'}</div>
                              <div className="text-muted text-xs">{entry.studentId?.student?.regNo}</div>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-primary fs-6">{entry.marks} Marks</span>
                              <div className="small fw-bold text-success mt-1">Grade: {entry.grade}</div>
                            </div>
                          </div>

                          {/* Rubric Criteria Max Table */}
                          <div className="border-top pt-2 mt-2">
                            <div className="text-muted small fw-semibold mb-1">Rubric Criteria:</div>
                            {selectedReviewDetails.evaluation.rubricSnapshot?.map((r, rIdx) => (
                              <div key={rIdx} className="d-flex justify-content-between small text-secondary py-1 border-bottom">
                                <span>{r.criterion}</span>
                                <span className="text-muted">Max: {r.maxMarks}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted small bg-light rounded border">
                    <Clock size={28} className="text-muted mb-2" />
                    <div className="fw-semibold">Marks Not Yet Published</div>
                    <div>Per academic rules, evaluation marks and panel comments are visible only after official publication by the Department HOD.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReviews;
