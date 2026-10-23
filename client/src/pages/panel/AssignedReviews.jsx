import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, Download, Calendar, Clock, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';

const AssignedReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Documents Modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load assigned reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocs = async (rev) => {
    setSelectedReview(rev);
    setDocsLoading(true);
    try {
      const projId = rev.projectId?.projectId || rev.projectId?._id || rev.projectId;
      const res = await api.get(`/projects/${projId}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load project documents', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.documentId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Assigned Project Reviews & Evaluations</h2>
        <p className="text-muted small mb-0">
          Review assigned team defenses, download project deliverables and source reports, and enter rubric evaluation marks.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          You are currently not assigned to any project evaluation panels.
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Review Details</th>
                  <th>Target Project</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev.reviewId}>
                    <td>
                      <div className="fw-bold text-dark">{rev.reviewType}</div>
                      <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.72rem' }}>
                        {rev.reviewId}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {typeof rev.projectId === 'object' && rev.projectId !== null
                          ? rev.projectId.projectId || rev.projectId.title || 'Project'
                          : String(rev.projectId || 'N/A')}
                      </span>
                      {typeof rev.projectId === 'object' && rev.projectId?.title && (
                        <div className="small text-muted text-truncate" style={{ maxWidth: '180px' }}>
                          {rev.projectId.title}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="small fw-medium text-dark d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        <span>{new Date(rev.reviewDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{new Date(rev.reviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="small text-muted d-flex align-items-center gap-1">
                        <MapPin size={13} />
                        <span>{rev.venue}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={rev.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                          onClick={() => handleOpenDocs(rev)}
                          title="View and download project documents"
                        >
                          <FileText size={14} /> Documents
                        </button>
                        <Link
                          to={`/panel/evaluations/${rev.reviewId}`}
                          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                        >
                          <Award size={14} /> Score Rubric
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={`Project Deliverables - ${
          typeof selectedReview?.projectId === 'object' && selectedReview?.projectId !== null
            ? selectedReview.projectId.projectId || selectedReview.projectId.title
            : selectedReview?.projectId || ''
        }`}
        size="lg"
      >
        <div>
          <p className="text-muted small mb-3">
            Review uploaded reports, thesis chapters, and presentations before conducting the evaluation session.
          </p>

          {docsLoading ? (
            <div className="text-center py-4">
              <Spinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No documents have been uploaded for this project yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th className="text-end">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.documentId}>
                      <td className="fw-semibold text-dark">{doc.fileName}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{doc.category}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border">v{doc.versionNumber}</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setSelectedReview(null)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignedReviews;
