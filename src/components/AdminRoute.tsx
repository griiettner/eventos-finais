import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, isAdminCheckComplete } = useAuth();

  // Aguardar tanto loading do Kinde quanto check de admin
  if (loading || !isAdminCheckComplete) {
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
        Verificando permissões...
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' />;
  }

  // Agora é seguro verificar isAdmin
  if (!user.isAdmin) {
    return <Navigate to='/dashboard' />;
  }

  return <>{children}</>;
};

export default AdminRoute;
