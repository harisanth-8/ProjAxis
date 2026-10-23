import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  }[size] || '';

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(23, 54, 93, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-dialog modal-dialog-centered ${sizeClass}`} role="document">
        <div className="modal-content shadow-sm border-0 rounded-3">
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-semibold" style={{ color: 'var(--color-navy)' }}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div className="modal-body p-4">{children}</div>
          {footer && <div className="modal-footer border-top py-2 px-4 bg-light">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default Modal;
