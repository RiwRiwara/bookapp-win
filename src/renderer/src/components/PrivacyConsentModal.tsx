import React, { useState } from 'react';
import { FiShield, FiEye, FiLock, FiAlertTriangle, FiCheck, FiX, FiMonitor } from 'react-icons/fi';
import { useScreenshotProtection } from '../hooks/useScreenshotProtection';
import toast from 'react-hot-toast';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (granted: boolean) => void;
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onClose, onConsent }) => {
  const {
    hasPermission,
    platformInfo,
    requestPermission,
    startProtection
  } = useScreenshotProtection();

  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);

  const requestScreenPermission = async () => {
    setIsRequestingPermission(true);
    setPermissionError(null);

    try {
      const granted = await requestPermission();
      setPermissionRequested(true);

      if (granted) {
        toast.success('Screen recording permission granted!', {
          duration: 3000,
          position: 'top-center'
        });
        console.log('[PrivacyConsent] Screen recording permission granted');
      } else {
        setPermissionError('Screen recording permission was denied. Some security features may not work properly.');
        toast.error('Permission denied', {
          duration: 3000,
          position: 'top-center'
        });
      }
    } catch (error) {
      const errorMessage = 'Error requesting permission. Please try again.';
      setPermissionError(errorMessage);
      console.error('[PrivacyConsent] Error requesting permission:', error);
      toast.error(errorMessage);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleAccept = async () => {
    // Store consent in localStorage
    localStorage.setItem('privacy-consent-given', 'true');
    localStorage.setItem('privacy-consent-date', new Date().toISOString());

    // Start screen protection
    try {
      await startProtection();
      toast.success('Privacy protection activated!', {
        duration: 2000,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error('[PrivacyConsent] Error starting protection:', error);
    }

    onConsent(true);
    onClose();
  };

  const handleDecline = () => {
    localStorage.setItem('privacy-consent-given', 'false');
    onConsent(false);
    onClose();
  };

  const isMacOS = platformInfo?.platform === 'darwin';
  const isWindows = platformInfo?.platform === 'win32';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-y-auto" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiShield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Security Settings</h2>
              <p className="text-sm text-gray-600">
                Platform: {platformInfo?.platform || 'Unknown'} ({platformInfo?.arch || 'Unknown'})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiLock className="w-5 h-5 mr-2 text-green-600" />
              Security Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <FiEye className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Screen Capture Protection</p>
                  <p className="text-sm text-green-700">
                    Automatically detects and prevents unauthorized screen recording or screenshots
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <FiMonitor className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Process Monitoring</p>
                  <p className="text-sm text-blue-700">
                    Monitors for suspicious screen capture applications and processes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <FiShield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">Content Protection</p>
                  <p className="text-sm text-purple-700">
                    {isWindows && 'Prevents window content from being captured on Windows 10+'}
                    {isMacOS && 'Integrates with macOS privacy controls for enhanced protection'}
                    {!isWindows && !isMacOS && 'Cross-platform content protection'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform-specific permissions */}
          {isMacOS && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiAlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                macOS Permissions Required
              </h3>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700 mb-3">
                  To enable screen capture protection on macOS, we need permission to monitor screen recording activity.
                  This allows us to detect when screen capture is attempted and protect your content.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {hasPermission ? (
                      <>
                        <FiCheck className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Permission Granted</span>
                      </>
                    ) : (
                      <>
                        <FiX className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Permission Required</span>
                      </>
                    )}
                  </div>
                  {!hasPermission && (
                    <button
                      onClick={requestScreenPermission}
                      disabled={isRequestingPermission}
                      // color style css
                      style={{
                        backgroundColor: 'orange',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      {isRequestingPermission ? 'Requesting...' : 'Grant Permission'}
                    </button>
                  )}
                </div>
                {permissionError && (
                  <p className="text-xs text-red-600 mt-2">
                    {permissionError}
                  </p>
                )}
                {permissionRequested && !hasPermission && (
                  <p className="text-xs text-orange-600 mt-2">
                    If permission was denied, you can grant it later in System Preferences → Security & Privacy → Privacy → Screen Recording
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Notice</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                This application implements security measures to protect your content from unauthorized capture.
                By continuing, you acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The app will monitor for screen capture attempts</li>
                <li>The app will automatically close if screen recording is detected</li>
                <li>Process monitoring is used to detect capture software</li>
                <li>No personal data is collected or transmitted</li>
                <li>All monitoring happens locally on your device</li>
              </ul>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Important Security Notice</p>
                <p className="text-sm text-red-700 mt-1">
                  If screen capture or recording is detected while using this application,
                  the app will immediately close to protect your content. Make sure to save
                  your work regularly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {/* Permission status for macOS */}
          {isMacOS && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                {hasPermission ? (
                  <>
                    <FiCheck className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">macOS permissions ready</span>
                  </>
                ) : (
                  <>
                    <FiAlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Please grant macOS screen recording permission first</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Exit App
            </button>
            <button
              onClick={handleAccept}
              disabled={isMacOS && !hasPermission}
              style={{
                backgroundColor: 'blue',
                color: 'white',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              {isMacOS && !hasPermission ? 'Grant Permission First' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
