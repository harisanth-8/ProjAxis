import React from 'react';

const FormField = ({ label, id, error, required, children, helperText }) => {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label small fw-semibold text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && <div className="form-text small text-muted">{helperText}</div>}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
};

export default FormField;
