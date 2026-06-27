  import type { ReactNode } from 'react';
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../hooks/useAuth';

  const ProtectedRoute = ({ children }: { children: ReactNode }) => {
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