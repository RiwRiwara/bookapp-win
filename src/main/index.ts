import { app, shell, BrowserWindow, ipcMain, systemPreferences, desktopCapturer, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Global variables for screen protection
let mainWindow: BrowserWindow | null = null
let screenProtectionActive = false
let screenCaptureCheckInterval: NodeJS.Timeout | null = null

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development' || is.dev

// Cross-platform screen capture detection
class ScreenCaptureProtection {
  private static instance: ScreenCaptureProtection
  private isMonitoring = false
  private developmentMode = isDevelopment

  // More conservative list for production, excluding common dev tools
  private suspiciousProcesses = [
    'obs', 'obs64', 'obs-studio', 'streamlabs', 'xsplit', 'bandicam', 'fraps',
    'camtasia', 'snagit', 'screenpresso', 'faststone', 'picpick'
    // Removed: 'greenshot', 'lightshot', 'gyazo', 'puush', 'screenshot', 'screencapture',
    // 'quicktime', 'vlc', 'ffmpeg', 'recordmydesktop', 'kazam', 'vokoscreen'
    // These are too common and may cause false positives
  ]

  static getInstance(): ScreenCaptureProtection {
    if (!ScreenCaptureProtection.instance) {
      ScreenCaptureProtection.instance = new ScreenCaptureProtection()
    }
    return ScreenCaptureProtection.instance
  }

  async checkMacOSScreenRecordingPermission(): Promise<boolean> {
    if (process.platform !== 'darwin') return true

    try {
      const status = systemPreferences.getMediaAccessStatus('screen')
      return status === 'granted'
    } catch (error) {
      console.error('[ScreenProtection] Error checking macOS permission:', error)
      return false
    }
  }

  async requestMacOSScreenRecordingPermission(): Promise<boolean> {
    if (process.platform !== 'darwin') return true

    try {
      // This will prompt the user for permission
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } })
      return sources.length > 0
    } catch (error) {
      console.error('[ScreenProtection] Error requesting macOS permission:', error)
      return false
    }
  }

  async detectScreenCapture(): Promise<boolean> {
    try {
      // Check for obvious screen capture tools in both dev and production
      const criticalProcesses = ['obs', 'obs64', 'obs-studio', 'bandicam', 'fraps']
      const criticalProcessDetected = await this.checkSpecificProcesses(criticalProcesses)
      if (criticalProcessDetected) {
        console.log('[ScreenProtection] Critical screen capture process detected')
        return true
      }

      // macOS-specific detection (always enabled)
      if (process.platform === 'darwin') {
        const macOSCapture = await this.detectMacOSScreenCapture()
        if (macOSCapture) {
          console.log('[ScreenProtection] macOS screen capture detected')
          return true
        }
      }

      // In development mode, skip additional process checks
      if (this.developmentMode) {
        console.log('[ScreenProtection] Development mode - skipping additional process checks')
        return false
      }

      // Production mode - full detection
      const processDetected = await this.checkSuspiciousProcesses()
      if (processDetected) {
        console.log('[ScreenProtection] Suspicious screen capture process detected')
        return true
      }

      // Windows-specific detection (production only)
      if (process.platform === 'win32') {
        return await this.detectWindowsScreenCapture()
      }

      return false
    } catch (error) {
      console.error('[ScreenProtection] Error in screen capture detection:', error)
      return false
    }
  }

  private async checkSuspiciousProcesses(): Promise<boolean> {
    try {
      const command = process.platform === 'win32' ? 'tasklist' : 'ps aux'
      const { stdout } = await execAsync(command)
      const processes = stdout.toLowerCase()

      return this.suspiciousProcesses.some(proc => processes.includes(proc))
    } catch (error) {
      console.error('[ScreenProtection] Error checking processes:', error)
      return false
    }
  }

  private async checkSpecificProcesses(processNames: string[]): Promise<boolean> {
    try {
      const command = process.platform === 'win32' ? 'tasklist' : 'ps aux'
      const { stdout } = await execAsync(command)
      const processes = stdout.toLowerCase()

      const detected = processNames.find(proc => processes.includes(proc))
      if (detected) {
        console.log(`[ScreenProtection] Detected process: ${detected}`)
        return true
      }
      return false
    } catch (error) {
      console.error('[ScreenProtection] Error checking specific processes:', error)
      return false
    }
  }

  private async detectMacOSScreenCapture(): Promise<boolean> {
    try {
      // Method 1: Check for active screen recording processes
      const screenRecordingProcesses = [
        'screencapture', 'Screenshot', 'QuickTime Player', 'CleanMyMac',
        'CleanMaster- Remove Junk Files', 'Keka', 'The Unarchiver',
        'ScreenSearch', 'Skitch', 'Snagit', 'CloudApp', 'Droplr',
        'Monosnap', 'LightShot', 'Gyazo', 'Capto'
      ]

      for (const process of screenRecordingProcesses) {
        try {
          const { stdout } = await execAsync(`pgrep -f "${process}"`)
          if (stdout.trim().length > 0) {
            console.log(`[ScreenProtection] Screen capture process detected: ${process}`)
            return true
          }
        } catch (error) {
          // Process not found, continue
        }
      }

      // Method 2: Check for screen recording using system APIs
      try {
        const { stdout } = await execAsync('lsof | grep "Screen Capture"')
        if (stdout.trim().length > 0) {
          console.log('[ScreenProtection] Active screen recording detected via lsof')
          return true
        }
      } catch (error) {
        // lsof command might fail, continue
      }

      // Method 3: Check for screenshot shortcuts being used
      try {
        const { stdout } = await execAsync('ps aux | grep -i screenshot | grep -v grep')
        if (stdout.trim().length > 0) {
          console.log('[ScreenProtection] Screenshot process detected')
          return true
        }
      } catch (error) {
        // Command failed, continue
      }

      // Method 4: Monitor for screen recording indicators
      try {
        // Check if any process is accessing the screen
        const { stdout } = await execAsync('lsof /dev/console 2>/dev/null || true')
        const lines = stdout.split('\n').filter(line => line.includes('screencapture') || line.includes('Screenshot'))
        if (lines.length > 0) {
          console.log('[ScreenProtection] Screen access detected via console monitoring')
          return true
        }
      } catch (error) {
        // Command failed, continue
      }

      return false
    } catch (error) {
      console.error('[ScreenProtection] Error in macOS screen capture detection:', error)
      return false
    }
  }

  private detectedProcess: string = ''

  private async detectWindowsScreenCapture(): Promise<boolean> {
    try {
      // Check for active screen recording processes
      const { stdout } = await execAsync('wmic process get name,processid')
      const processes = stdout.toLowerCase()

      // Check for known screen capture processes
      const captureProcesses = ['winlogon.exe']
      const detectedProc = captureProcesses.find(proc => {
        const regex = new RegExp(proc, 'i')
        return regex.test(processes)
      })

      if (detectedProc) {
        this.detectedProcess = detectedProc
        console.log(`[ScreenProtection] Potential screen capture detected on Windows: ${detectedProc}`)
        return true
      }

      return false
    } catch (error) {
      console.error('[ScreenProtection] Error detecting Windows screen capture:', error)
      return false
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('[ScreenProtection] Already monitoring, skipping start')
      return
    }

    // Check if screen protection is disabled via environment variable
    if (process.env.DISABLE_SCREEN_PROTECTION === 'true') {
      console.log('[ScreenProtection] Screen protection disabled via environment variable')
      this.isMonitoring = true // Mark as monitoring to prevent repeated attempts
      return
    }

    this.isMonitoring = true
    console.log(`[ScreenProtection] Starting screen capture monitoring (${this.developmentMode ? 'development' : 'production'} mode)`)

    // Check every 2 seconds (or 5s in development for better responsiveness)
    const checkInterval = this.developmentMode ? 5000 : 2000 // 5s in dev, 2s in prod
    screenCaptureCheckInterval = setInterval(async () => {
      const captureDetected = await this.detectScreenCapture()
      if (captureDetected) {
        await this.handleScreenCaptureDetected()
      }
    }, checkInterval)
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('[ScreenProtection] Already stopped, skipping stop')
      return
    }

    this.isMonitoring = false
    console.log('[ScreenProtection] Stopping screen capture monitoring')

    if (screenCaptureCheckInterval) {
      clearInterval(screenCaptureCheckInterval)
      screenCaptureCheckInterval = null
    }
  }

  private async handleScreenCaptureDetected(): Promise<void> {
    console.log('[ScreenProtection] SECURITY ALERT: Screen capture detected!')

    // Stop monitoring to prevent multiple dialogs
    this.stopMonitoring()

    // Show dialog to user explaining why the app is closing
    const detectedInfo = this.detectedProcess ? `\n\nDetected process: ${this.detectedProcess}` : ''
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: 'Security Alert - Screen Capture Detected',
      message: 'Screen capture or recording activity has been detected',
      detail: `For security reasons, this application must close when screen recording is detected. This helps protect sensitive content from unauthorized capture.${detectedInfo}\n\nThe application will now close to ensure content security.`,
      buttons: ['OK', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    })

    // Close app after user acknowledges
    if (result.response === 0) {
      console.log('[ScreenProtection] User acknowledged security alert, closing application')
      app.quit()
    } else {
      console.log('[ScreenProtection] User cancelled, but app will close anyway for security')
      // Still close for security, but give user a moment
      setTimeout(() => {
        app.quit()
      }, 1000)
    }
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    }
  })

  // Enhanced window security settings
  if (process.platform === 'darwin') {
    // macOS specific security settings
    mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: false })
  }

  // Prevent window capture on Windows
  if (process.platform === 'win32') {
    try {
      // Set window to be excluded from capture (Windows 10+)
      mainWindow.setContentProtection(true)
    } catch (error) {
      console.warn('[ScreenProtection] Content protection not available on this Windows version')
    }
  }

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for PDF fetching
  ipcMain.handle('fetch-pdf', async (_event, url: string) => {
    try {
      console.log('Fetching PDF from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error fetching PDF:', error);
      throw error;
    }
  });

  // IPC handlers for screen protection
  // Screen protection IPC handlers
  const screenProtection = ScreenCaptureProtection.getInstance();

  // Check platform and permissions
  ipcMain.handle('check-platform-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version
    };
  });

  // Check macOS screen recording permission
  ipcMain.handle('check-screen-permission', async () => {
    if (process.platform === 'darwin') {
      return await screenProtection.checkMacOSScreenRecordingPermission();
    }
    return true; // Windows doesn't require explicit permission
  });

  // Request macOS screen recording permission
  ipcMain.handle('request-screen-permission', async () => {
    if (process.platform === 'darwin') {
      return await screenProtection.requestMacOSScreenRecordingPermission();
    }
    return true;
  });

  // Start screen protection monitoring
  ipcMain.handle('start-screen-protection', async () => {
    try {
      screenProtectionActive = true;
      screenProtection.startMonitoring();
      console.log('[Main] Screen protection started');
      return { success: true };
    } catch (error) {
      console.error('[Main] Error starting screen protection:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Stop screen protection monitoring
  ipcMain.handle('stop-screen-protection', async () => {
    try {
      screenProtectionActive = false;
      screenProtection.stopMonitoring();
      console.log('[Main] Screen protection stopped');
      return { success: true };
    } catch (error) {
      console.error('[Main] Error stopping screen protection:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Get screen protection status
  ipcMain.handle('get-screen-protection-status', async () => {
    return {
      active: screenProtectionActive,
      platform: process.platform
    };
  });

  // Handle app quit request
  ipcMain.on('app-quit', () => {
    console.log('[Main] App quit requested');
    app.quit();
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
