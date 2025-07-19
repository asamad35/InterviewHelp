import { is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import fs from 'fs'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { initializeIpcHandler } from './lib/ipc-handler'

// Configure app paths and cache BEFORE app.whenReady()
function configureAppPaths(): void {
  try {
    const appDataPath = path.join(app.getPath('appData'), 'interview-help')
    const cachePath = path.join(appDataPath, 'cache')

    console.log('Config path:', path.join(appDataPath, 'config.json'))
    console.log('App data path:', appDataPath)
    console.log('Cache path:', cachePath)

    // Create directories if they don't exist
    for (const dir of [appDataPath, cachePath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        // Set proper permissions on Windows
        if (process.platform === 'win32') {
          try {
            fs.chmodSync(dir, 0o755)
          } catch (chmodError) {
            console.warn('Could not set directory permissions:', chmodError)
          }
        }
      }
    }

    // Set app paths BEFORE any other initialization
    app.setPath('userData', appDataPath)
    app.setPath('cache', cachePath)
    app.setPath('temp', path.join(appDataPath, 'temp'))
    app.setPath('logs', path.join(appDataPath, 'logs'))
  } catch (error) {
    console.error('Failed to configure app paths:', error)
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 750,
    minHeight: 550,
    x: 0,
    y: 50,
    show: false,
    alwaysOnTop: true,
    // frame: false,
    // transparent: true,
    fullscreenable: false,
    hasShadow: false,
    opacity: 1,
    backgroundColor: '#000000',
    focusable: true,
    // skipTaskbar: true,
    type: 'panel',
    paintWhenInitiallyHidden: true,
    // titleBarStyle: 'hidden',
    movable: true,
    enableLargerThanScreen: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      scrollBounce: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

async function initializeApp() {
  try {
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    initializeIpcHandler()
    createWindow()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
}

// Configure paths BEFORE app ready
configureAppPaths()

// Additional app configuration for cache handling
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('disable-gpu-sandbox')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initializeApp)

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
