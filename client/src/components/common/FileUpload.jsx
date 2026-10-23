import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/client';

const FileUpload = ({
  category = 'Report',
  projectId,
  proposalId,
  progressReportId,
  reviewId,
  versionGroupId,
  onUploadSuccess,
  maxSizeMB = 10,
  allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'png', 'jpg']
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setError(null);
    setSuccess(false);
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate size
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size limit of ${maxSizeMB} MB`);
      return;
    }

    // Validate extension
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`File extension '.${ext}' not allowed. Permitted: ${allowedExtensions.join(', ')}`);
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (projectId) formData.append('projectId', projectId);
    if (proposalId) formData.append('proposalId', proposalId);
    if (progressReportId) formData.append('progressReportId', progressReportId);
    if (reviewId) formData.append('reviewId', reviewId);
    if (versionGroupId) formData.append('versionGroupId', versionGroupId);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-3 border-dashed bg-light">
      <div className="d-flex flex-column align-items-center text-center p-3">
        <UploadCloud size={36} className="text-muted mb-2" />
        <h6 className="fw-semibold mb-1">Upload Project Document</h6>
        <p className="small text-muted mb-3">
          Permitted formats: {allowedExtensions.join(', ')} (Max {maxSizeMB} MB)
        </p>

        <input
          type="file"
          id="file-upload-input"
          className="d-none"
          onChange={handleFileChange}
          accept={allowedExtensions.map((e) => `.${e}`).join(',')}
        />

        <label htmlFor="file-upload-input" className="btn btn-outline-primary btn-sm mb-2">
          Select Document
        </label>

        {file && (
          <div className="d-flex align-items-center gap-2 mt-2 p-2 bg-white rounded border w-100 justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <File size={16} className="text-secondary flex-shrink-0" />
              <span className="small text-truncate">{file.name}</span>
              <span className="small text-muted flex-shrink-0">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex-shrink-0"
              disabled={uploading}
              onClick={handleUpload}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 small mt-3 mb-0 d-flex align-items-center gap-2 w-100">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success py-2 px-3 small mt-3 mb-0 d-flex align-items-center gap-2 w-100">
            <CheckCircle2 size={16} />
            <span>Document uploaded successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
