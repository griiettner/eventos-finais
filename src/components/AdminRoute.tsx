import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className='loading-screen'
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: 'var(--primary)',
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' />;
  }

  if (!user.isAdmin) {
    return <Navigate to='/dashboard' />;
  }

  return <>{children}</>;
};

export default AdminRoute;
