import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Remove the global declaration as it's already defined in preload.d.ts

export const useScreenshotProtection = () => {
  const { logout } = useAuth();

  const handleScreenshotDetected = useCallback(() => {
    // Show warning dialog
    window.confirm(
      '⚠️ Screenshot/Screen Recording Detected!\n\n' +
      'For security reasons, capturing screenshots or recording the screen is not allowed while using this application.\n\n' +
      'You will be logged out automatically to protect sensitive content.\n\n' +
      'Click OK to continue.'
    );

    // Log out the user regardless of their choice
    setTimeout(() => {
      logout();
    }, 1000);
  }, [logout]);

  const handleForceLogout = useCallback(() => {
    logout();
  }, [logout]);

  const startProtection = useCallback(() => {
    try {
      if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('start-protection');
      } else {
        console.warn('Electron IPC not available - screenshot protection disabled');
      }
    } catch (error) {
      console.warn('Failed to start screenshot protection:', error);
    }
  }, []);

  const stopProtection = useCallback(() => {
    try {
      if (window.electron?.ipcRenderer?.send) {
        window.electron.ipcRenderer.send('stop-protection');
      } else {
        console.warn('Electron IPC not available - screenshot protection disabled');
      }
    } catch (error) {
      console.warn('Failed to stop screenshot protection:', error);
    }
  }, []);

  useEffect(() => {
    if (!window.electron?.ipcRenderer) {
      console.warn('Electron IPC not available - screenshot protection disabled');
      return;
    }

    // Set up event listeners
    const unsubscribeScreenshot = window.electron.ipcRenderer.on(
      'screenshot-detected',
      handleScreenshotDetected
    );

    const unsubscribeForceLogout = window.electron.ipcRenderer.on(
      'force-logout',
      handleForceLogout
    );

    // Additional browser-based protection
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        // Windows/Linux: Print Screen, Alt+Print Screen, Windows+Print Screen
        event.key === 'PrintScreen' ||
        (event.altKey && event.key === 'PrintScreen') ||
        (event.metaKey && event.key === 'PrintScreen') ||
        // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
        (event.metaKey && event.shiftKey && ['3', '4', '5'].includes(event.key)) ||
        // Developer tools
        (event.key === 'F12') ||
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (event.metaKey && event.altKey && event.key === 'I')
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleScreenshotDetected();
        return false;
      }
      return true;
    };

    const handleContextMenu = (event: MouseEvent) => {
      // Disable right-click context menu to prevent "Inspect Element"
      event.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    // Cleanup function
    return () => {
      unsubscribeScreenshot();
      unsubscribeForceLogout();
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [handleScreenshotDetected, handleForceLogout]);

  return {
    startProtection,
    stopProtection,
  };
};
