import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChapterDetail from './pages/ChapterDetail';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AddEditChapter from './pages/AddEditChapter';
import ChapterQuestions from './pages/ChapterQuestions';
import AdminRoute from './components/AdminRoute';
import { AnimatePresence } from 'framer-motion';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading)
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

  if (!user) {
    return <Navigate to='/login' />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <>
      <AnimatePresence mode='wait'>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
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
          <Route
            path='/admin'
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/chapter/new'
            element={
              <AdminRoute>
                <AddEditChapter />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/chapter/:id'
            element={
              <AdminRoute>
                <AddEditChapter />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/chapter/:id/questions'
            element={
              <AdminRoute>
                <ChapterQuestions />
              </AdminRoute>
            }
          />
        </Routes>
      </AnimatePresence>
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
