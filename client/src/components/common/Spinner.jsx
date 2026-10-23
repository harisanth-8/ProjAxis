import React from 'react';

const Spinner = ({ size = 'md', message = 'Loading details...' }) => {
  const sizeMap = {
    sm: '1.25rem',
    md: '2rem',
    lg: '3rem'
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 my-4">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderColor: 'var(--color-border)',
          borderTopColor: 'var(--color-navy)'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <div className="small text-muted">{message}</div>}
    </div>
  );
};

export default Spinner;
