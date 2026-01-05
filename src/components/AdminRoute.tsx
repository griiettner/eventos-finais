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
    console.log('[AdminRoute] No user, redirecting to login');
    return <Navigate to='/login' />;
  }

  if (!user.isAdmin) {
    console.log('[AdminRoute] User is not admin, redirecting to dashboard');
    return <Navigate to='/dashboard' />;
  }

  console.log('[AdminRoute] User is admin, rendering admin content');
  return <>{children}</>;
};

export default AdminRoute;
