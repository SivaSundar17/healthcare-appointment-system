import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading, isAuthenticated, profileComplete } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If profile is not complete, redirect to profile completion page
  // But don't redirect if already on the complete-profile page
  if (!profileComplete && window.location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // If specific roles are required, check access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on user's actual role
    if (userRole === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (userRole === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
