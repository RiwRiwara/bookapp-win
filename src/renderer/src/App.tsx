import React, { useState, useEffect, JSX } from 'react';
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
import PrivacyConsentModal from './components/PrivacyConsentModal';


const InnerApp: React.FC = () => {
  const [page, setPage] = useState('library');
  const [authPage, setAuthPage] = useState<
    'login' | 'register' | 'forgot' | 'reset'
  >('login');
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(true);
  const [privacyConsentGiven, setPrivacyConsentGiven] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { startProtection, stopProtection } = useScreenshotProtection();

  // Check if privacy consent was previously given
  useEffect(() => {
    // For development/testing: Always show privacy consent
    // Comment out the next line if you want to remember consent
    localStorage.removeItem('privacy-consent-given');

    const consentGiven = localStorage.getItem('privacy-consent-given');
    if (consentGiven === 'true') {
      setPrivacyConsentGiven(true);
      setShowPrivacyConsent(false);
    }
  }, []);

  // Start/stop protection based on authentication status and consent
  useEffect(() => {
    if (isAuthenticated && privacyConsentGiven) {
      startProtection();
    } else {
      stopProtection();
    }

    // Cleanup on unmount
    return () => {
      stopProtection();
    };
  }, [isAuthenticated, privacyConsentGiven, startProtection, stopProtection]);

  // Handle privacy consent
  const handlePrivacyConsent = (granted: boolean) => {
    setPrivacyConsentGiven(granted);
    setShowPrivacyConsent(false);
    if (granted) {
      localStorage.setItem('privacy-consent-given', 'true');
      localStorage.setItem('privacy-consent-date', new Date().toISOString());
    } else {
      localStorage.setItem('privacy-consent-given', 'false');
      // If consent is not given, close the app
      if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('app-quit');
      }
    }
  };

  const handleClosePrivacyModal = () => {
    // Don't allow closing without making a choice
    // Modal should handle this internally
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Show privacy consent modal first
  if (showPrivacyConsent) {
    return (
      <>
        <PrivacyConsentModal
          isOpen={showPrivacyConsent}
          onClose={handleClosePrivacyModal}
          onConsent={handlePrivacyConsent}
        />
        <Toaster position="top-right" />
      </>
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

  let content: JSX.Element | null = null;

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
