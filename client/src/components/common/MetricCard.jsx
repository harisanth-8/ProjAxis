import React from 'react';

const MetricCard = ({ title, value, subtext, icon: Icon, badgeText, badgeColor }) => {
  return (
    <div className="card h-100 p-3 shadow-none">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="small text-muted fw-medium text-uppercase letter-spacing-1">{title}</span>
        {Icon && (
          <div
            className="d-flex align-items-center justify-content-center p-2 rounded"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-academic-blue)' }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="d-flex align-items-baseline gap-2">
        <h3 className="mb-0 fw-bold" style={{ color: 'var(--color-navy)' }}>{value}</h3>
        {badgeText && (
          <span
            className="badge"
            style={{
              backgroundColor: badgeColor ? `${badgeColor}20` : 'var(--color-light-blue)',
              color: badgeColor || 'var(--color-academic-blue)'
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
      {subtext && <div className="small text-muted mt-2">{subtext}</div>}
    </div>
  );
};

export default MetricCard;
