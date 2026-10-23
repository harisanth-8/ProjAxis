import React from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      }
    >
      <div className="d-flex gap-3 align-items-start">
        <div
          className="p-2 rounded-circle flex-shrink-0"
          style={{
            backgroundColor: isDanger ? 'var(--color-error)15' : 'var(--color-warning)15',
            color: isDanger ? 'var(--color-error)' : 'var(--color-warning)'
          }}
        >
          <AlertCircle size={24} />
        </div>
        <div className="text-secondary small mt-1">{message}</div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
