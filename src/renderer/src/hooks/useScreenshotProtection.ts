import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ScreenshotProtectionHook {
  startProtection: () => void;
  stopProtection: () => void;
  isProtectionActive: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  platformInfo: { platform: string; arch: string; version: string } | null;
}

const useScreenshotProtection = (): ScreenshotProtectionHook => {
  const { logout } = useAuth();
  const isProtectionActiveRef = useRef(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [platformInfo, setPlatformInfo] = useState<{ platform: string; arch: string; version: string } | null>(null);

  // Initialize platform info and permissions
  useEffect(() => {
    const initializePlatformInfo = async () => {
      if (window.electron?.ipcRenderer?.invoke) {
        try {
          const platform = await window.electron.ipcRenderer.invoke('check-platform-info');
          setPlatformInfo(platform);
          
          const permission = await window.electron.ipcRenderer.invoke('check-screen-permission');
          setHasPermission(permission);
        } catch (error) {
          console.error('[ScreenProtection] Error initializing platform info:', error);
        }
      }
    };

    initializePlatformInfo();
  }, []);

  const handleScreenshotDetected = useCallback(() => {
    toast.error('🚨 Screen capture detected! App will close for security.', {
      duration: 2000,
      position: 'top-center'
    });

    // Show warning dialog
    const userConfirmed = window.confirm(
      '⚠️ Screenshot/Screen Recording Detected!\n\n' +
      'For security reasons, capturing screenshots or recording the screen is not allowed while using this application.\n\n' +
      'The application will close automatically to protect sensitive content.\n\n' +
      'Click OK to acknowledge.'
    );

    // Log out the user regardless of their choice
    setTimeout(() => {
      logout();
    }, userConfirmed ? 500 : 100);
  }, [logout]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!window.electron?.ipcRenderer?.invoke) {
      console.warn('[ScreenProtection] Electron IPC not available');
      return false;
    }

    try {
      const granted = await window.electron.ipcRenderer.invoke('request-screen-permission');
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('[ScreenProtection] Error requesting permission:', error);
      return false;
    }
  }, []);

  const startProtection = useCallback(async () => {
    // Prevent redundant starts
    if (isProtectionActiveRef.current) {
      console.log('[ScreenProtection] Protection already active, skipping start');
      return;
    }

    try {
      if (window.electron?.ipcRenderer?.invoke) {
        const result = await window.electron.ipcRenderer.invoke('start-screen-protection');
        if (result.success) {
          isProtectionActiveRef.current = true;
          console.log('[ScreenProtection] Protection started successfully');
          toast.success('🛡️ Screen protection activated', {
            duration: 2000,
            position: 'bottom-right'
          });
        } else {
          console.error('[ScreenProtection] Failed to start protection:', result.error);
          toast.error('Failed to start screen protection');
        }
      } else {
        console.warn('[ScreenProtection] Electron IPC not available - using browser fallback');
        isProtectionActiveRef.current = true;
      }
    } catch (error) {
      console.error('[ScreenProtection] Error starting protection:', error);
      toast.error('Error starting screen protection');
    }
  }, []);

  const stopProtection = useCallback(async () => {
    // Prevent redundant stops
    if (!isProtectionActiveRef.current) {
      console.log('[ScreenProtection] Protection already inactive, skipping stop');
      return;
    }

    try {
      if (window.electron?.ipcRenderer?.invoke) {
        const result = await window.electron.ipcRenderer.invoke('stop-screen-protection');
        if (result.success) {
          isProtectionActiveRef.current = false;
          console.log('[ScreenProtection] Protection stopped successfully');
        } else {
          console.error('[ScreenProtection] Failed to stop protection:', result.error);
        }
      } else {
        isProtectionActiveRef.current = false;
      }
    } catch (error) {
      console.error('[ScreenProtection] Error stopping protection:', error);
    }
  }, []);

  // Set up IPC listeners for screen capture detection
  useEffect(() => {
    if (!window.electron?.ipcRenderer?.on) {
      console.warn('[ScreenProtection] Electron IPC not available');
      return;
    }

    // Listen for screen capture detection events from main process
    const handleScreenCaptureDetected = () => {
      console.log('[ScreenProtection] Screen capture detected via IPC');
      handleScreenshotDetected();
    };

    window.electron.ipcRenderer.on('screen-capture-detected', handleScreenCaptureDetected);
    window.electron.ipcRenderer.on('screenshot-detected', handleScreenCaptureDetected);

    // Cleanup listeners on unmount
    return () => {
      if (window.electron?.ipcRenderer?.removeListener) {
        window.electron.ipcRenderer.removeListener('screen-capture-detected', handleScreenCaptureDetected);
        window.electron.ipcRenderer.removeListener('screenshot-detected', handleScreenCaptureDetected);
      }
    };
  }, [handleScreenshotDetected]);

  // Browser-based protection fallback
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): boolean => {
      // Detect common screenshot shortcuts
      if (
        // macOS screenshot shortcuts
        (event.metaKey && event.shiftKey && event.key === '3') || // Full screen
        (event.metaKey && event.shiftKey && event.key === '4') || // Selection
        (event.metaKey && event.shiftKey && event.key === '5') || // Screenshot utility
        (event.metaKey && event.shiftKey && event.key === '6') || // Touch Bar screenshot
        // Windows screenshot shortcuts
        (event.key === 'PrintScreen') || // Windows PrintScreen
        (event.altKey && event.key === 'PrintScreen') || // Windows Alt+PrintScreen
        (event.ctrlKey && event.key === 'PrintScreen') || // Windows Ctrl+PrintScreen
        // Developer tools (can be used for screenshots)
        (event.ctrlKey && event.shiftKey && event.key === 'I') || // DevTools
        (event.metaKey && event.altKey && event.key === 'I') || // macOS DevTools
        (event.key === 'F12') || // DevTools
        // Additional shortcuts
        (event.metaKey && event.key === 'u') || // View source
        (event.ctrlKey && event.key === 'u') // View source
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.log(`[ScreenProtection] Screenshot shortcut detected: ${event.key}`);
        toast.error('🚫 Screenshot attempt blocked!', {
          duration: 3000,
          position: 'top-center'
        });
        handleScreenshotDetected();
        return false;
      }
      return true;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isProtectionActiveRef.current) {
        console.log('[ScreenProtection] Document hidden - potential screen capture');
        // Note: This is a weak signal, so we don't trigger protection immediately
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      if (isProtectionActiveRef.current) {
        event.preventDefault();
      }
    };

    // Prevent drag and drop
    const handleDragStart = (event: DragEvent) => {
      if (isProtectionActiveRef.current) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [handleScreenshotDetected]);

  return {
    startProtection,
    stopProtection,
    isProtectionActive: isProtectionActiveRef.current,
    hasPermission,
    requestPermission,
    platformInfo
  };
};

export { useScreenshotProtection };
