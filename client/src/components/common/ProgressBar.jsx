import React from 'react';

const ProgressBar = ({ value, label, subtext, color = 'var(--color-navy)', height = 8 }) => {
  // If string percentage (e.g. "45%"), parse number
  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
  const isNoData = isNaN(numValue);

  return (
    <div className="w-100">
      {(label || subtext) && (
        <div className="d-flex justify-content-between align-items-center mb-1">
          {label && <span className="small text-muted">{label}</span>}
          {subtext && <span className="small fw-semibold">{subtext}</span>}
        </div>
      )}
      <div
        className="progress"
        style={{
          height: `${height}px`,
          backgroundColor: 'var(--color-border)',
          borderRadius: '4px'
        }}
      >
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: isNoData ? '0%' : `${Math.min(100, Math.max(0, numValue))}%`,
            backgroundColor: color,
            transition: 'width 0.3s ease'
          }}
          aria-valuenow={isNoData ? 0 : numValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
