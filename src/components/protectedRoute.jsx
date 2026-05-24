  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';

  const ProtectedRoute = ({ children }) => {
      const { session } = useAuth();

      if (session === undefined) {
          return <div>Loading...</div>;
      }

      if (session === null) {
          return <Navigate to="/login" replace />;
      }

      return children;
  };

  export default ProtectedRoute;