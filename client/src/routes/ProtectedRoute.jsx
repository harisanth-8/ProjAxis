import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, activeRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (user.accountStatus !== 'Active') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(activeRole);
    if (!hasRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
