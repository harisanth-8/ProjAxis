import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AccessDenied = () => {
  const { activeRole } = useAuth();

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3 text-center" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="card shadow-sm border p-5" style={{ maxWidth: '480px', borderRadius: '12px' }}>
        <div
          className="d-inline-flex p-3 rounded-circle mx-auto mb-3"
          style={{ backgroundColor: 'var(--color-error)15', color: 'var(--color-error)' }}
        >
          <ShieldX size={44} />
        </div>
        <h3 className="fw-bold mb-2" style={{ color: 'var(--color-navy)' }}>Access Denied</h3>
        <p className="text-secondary small mb-4">
          You do not have the required role privileges or departmental permissions to view this resource.
        </p>
        <div>
          <Link to={activeRole ? `/${activeRole}/dashboard` : '/login'} className="btn btn-primary btn-sm px-4">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
