import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Upload, History, Filter } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import FileUpload from '../common/FileUpload';
import FormField from '../common/FormField';
import ConfirmDialog from '../common/ConfirmDialog';
import Spinner from '../common/Spinner';

const ProjectDocuments = ({ projectId, canUpload = true, canDelete = false }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [category, setCategory] = useState('Report');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    formData.append('projectId', projectId);

    try {
      await api.post(`/projects/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.documentId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Download failed or unauthorized');
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await api.delete(`/documents/${docToDelete.documentId}`);
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="pa-card">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Project Document Repository</h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Centralized, version-controlled project assets, reports, presentations, and source artifacts.
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload size={16} /> Upload Document
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-5 text-muted">
          No documents uploaded for this project yet.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Version</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.documentId}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <FileText size={18} className="text-muted" />
                      <span className="fw-semibold text-dark">{doc.fileName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{doc.category}</span>
                  </td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary border">
                      v{doc.versionNumber || 1}
                    </span>
                  </td>
                  <td className="text-muted small">{formatFileSize(doc.size)}</td>
                  <td className="text-muted small">{doc.uploadedBy?.name || 'User'}</td>
                  <td className="text-muted small">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        onClick={() => handleDownload(doc)}
                        title="Download Document"
                      >
                        <Download size={14} /> Download
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDocToDelete(doc)}
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Project Document"
        size="md"
      >
        <form onSubmit={handleUpload}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="Document Category" required>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Proposal">Proposal</option>
              <option value="Report">Report / Thesis</option>
              <option value="Presentation">Presentation (PPT / PDF)</option>
              <option value="Source Code">Source Code Archive (ZIP)</option>
              <option value="Other">Other Supporting Asset</option>
            </select>
          </FormField>

          <FormField label="Select File (Max 10MB)" required>
            <FileUpload
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
              onChange={(file) => setSelectedFile(file)}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        title="Delete Document?"
        message={`Are you sure you want to remove "${docToDelete?.fileName}"? Soft-delete preserves history.`}
        confirmText="Delete Document"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default ProjectDocuments;
