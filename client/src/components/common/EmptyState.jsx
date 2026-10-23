import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="card p-5 text-center my-3 border-dashed">
      <div
        className="d-inline-flex p-3 rounded-circle mx-auto mb-3"
        style={{ backgroundColor: 'var(--color-page-bg)', color: 'var(--color-text-muted)' }}
      >
        <Icon size={32} />
      </div>
      <h5 className="fw-semibold mb-1" style={{ color: 'var(--color-navy)' }}>{title}</h5>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '420px' }}>{description}</p>
      {actionLabel && onAction && (
        <div>
          <button className="btn btn-primary btn-sm" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
