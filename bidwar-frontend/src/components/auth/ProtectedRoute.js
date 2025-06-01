import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Correction du chemin pour useAuth
import { useAuth } from '../../hooks/useAuth'; // Était correct, mais revérifié

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container loading-text" style={{paddingTop: 'var(--navbar-height)'}}>Chargement de la session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    console.warn(`User role ${user?.role} not in allowed roles: ${roles.join(', ')} for ${location.pathname}`);
    return <Navigate to="/" state={{ unauthorized: true, attemptedPath: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;