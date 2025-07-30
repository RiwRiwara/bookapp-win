import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LibraryPage from './pages/LibraryPage';
import MyListPage from './pages/MyListPage';
import MyCloudPage from './pages/MyCloudPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { useScreenshotProtection } from './hooks/useScreenshotProtection';
import ProtectionStatus from './components/ProtectionStatus';


const InnerApp: React.FC = () => {
  const [page, setPage] = useState('library');
  const [authPage, setAuthPage] = useState<
    'login' | 'register' | 'forgot' | 'reset'
  >('login');
  const { isAuthenticated, loading } = useAuth();
  const { startProtection, stopProtection } = useScreenshotProtection();

  // Start/stop protection based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      startProtection();
    } else {
      stopProtection();
    }

    // Cleanup on unmount
    return () => {
      stopProtection();
    };
  }, [isAuthenticated, startProtection, stopProtection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === 'login')
      return <LoginPage onNavigate={(p: any) => setAuthPage(p as any)} />;
    if (authPage === 'register')
      return <RegisterPage onBack={() => setAuthPage('login')} />;
    if (authPage === 'forgot')
      return <ForgotPasswordPage onBack={() => setAuthPage('login')} />;
    if (authPage === 'reset')
      return <ResetPasswordPage onBack={() => setAuthPage('login')} />;
  }

  let content = null;
  if (page === 'library') content = <LibraryPage />;
  else if (page === 'mylist') content = <MyListPage />;
  else if (page === 'mycloud') content = <MyCloudPage />;
  else if (page === 'profile') content = <ProfilePage />;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className="flex-1 overflow-auto">{content}</div>
      <ProtectionStatus isProtected={isAuthenticated} />
    </div>
  );
};

const App: React.FC = () => (
  <UserProvider>
    <AuthProvider>
      <InnerApp />
      <Toaster position="top-right" />
    </AuthProvider>
  </UserProvider>
);

export default App;
