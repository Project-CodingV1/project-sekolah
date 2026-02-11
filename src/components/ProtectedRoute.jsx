import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userData, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    // Redirect berdasarkan role
    switch (userData?.role) {
      case 'super_admin':
        return <Navigate to="/superadmin/schools" />;
      case 'school_admin':
        return <Navigate to="/admin/master" />;
      case 'teacher':
        return <Navigate to="/guru/classes" />;
      case 'student':
        return <Navigate to="/murid/classes" />;
      case 'parent':
        return <Navigate to="/orangtua/children" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  return children;
};

export default ProtectedRoute;