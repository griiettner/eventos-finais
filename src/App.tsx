import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChapterDetail from './pages/ChapterDetail';
import LoginPage from './pages/LoginPage';
import VerificationPage from './pages/VerificationPage';
import { AnimatePresence } from 'framer-motion';
import SyncManager from './components/SyncManager';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className='loading-screen'>Carregando...</div>;
  if (!user) return <Navigate to='/login' />;
  if (!user.isVerified) return <Navigate to='/verify' />;

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <>
      <AnimatePresence mode='wait'>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/verify' element={<VerificationPage />} />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/chapter/:id'
            element={
              <ProtectedRoute>
                <ChapterDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      <SyncManager />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
