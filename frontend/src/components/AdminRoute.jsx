import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap admin-only routes with this. Assumes the caller is already inside
// a <ProtectedRoute> (or otherwise guaranteed authenticated) — this only
// adds the extra role check on top.
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
