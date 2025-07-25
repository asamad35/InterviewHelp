import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, screen, shell } from 'electron'
import fs from 'fs'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { initializeIpcHandler } from './lib/ipc-handler'
import { KeyboardShortcutsHelper } from './lib/keyboard-shortcuts'

const state = {
  mainWindow: null as BrowserWindow | null,
  isWindowVisible: false,
  windowPosition: null as { x: number; y: number } | null,
  windowSize: null as { width: number; height: number } | null,
  screenWidth: 0,
  screenHeight: 0,
  step: 0,
  currentX: 0,
  currentY: 0,

  keyboardShortcuts: null as KeyboardShortcutsHelper | null
}

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
  if (state.mainWindow) {
    if (state.mainWindow.isMinimized()) state.mainWindow.restore()
    state.mainWindow.focus()
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workAreaSize
  state.screenWidth = workArea.width
  state.screenHeight = workArea.height

  state.step = 60
  state.currentY = 50

  // Create the browser window.
  const windowSettings: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    minWidth: 750,
    minHeight: 550,
    x: state.currentX,
    y: state.currentY,
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
  }

  state.mainWindow = new BrowserWindow(windowSettings)

  state.mainWindow.on('ready-to-show', () => {
    state.mainWindow?.show()
  })

  state.mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    state.mainWindow?.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    state.mainWindow?.loadFile(join(__dirname, '../renderer/index.html'))
  }

  state.mainWindow?.webContents.setZoomFactor(1)
  state.mainWindow.webContents.openDevTools({ mode: 'right' })
  state.mainWindow?.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  state.mainWindow?.setContentProtection(true)
  state.mainWindow?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  state.mainWindow?.setAlwaysOnTop(true, 'screen-saver', 1)

  if (process.platform === 'darwin') {
    state.mainWindow?.setHiddenInMissionControl(true)
    state.mainWindow?.setWindowButtonVisibility(false)
    state.mainWindow?.setBackgroundColor('#00000000')
    state.mainWindow?.setSkipTaskbar(true)
    state.mainWindow?.setHasShadow(false)
  }

  state.mainWindow?.on('close', () => {
    state.mainWindow = null
    state.isWindowVisible = false
  })
  state.mainWindow?.webContents.setBackgroundThrottling(false)
  state.mainWindow?.webContents.setFrameRate(60)

  const bounds = state.mainWindow.getBounds()
  state.windowSize = { width: bounds.width, height: bounds.height }
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.currentX = bounds.x
  state.currentY = bounds.y
  state.isWindowVisible = true

  state.mainWindow.showInactive()

  state.mainWindow.on('move', handleWindowMove)
  state.mainWindow.on('resize', handleWindowResize)
  state.mainWindow.on('close', handleWindowClose)
}

function handleWindowMove(): void {
  if (!state.mainWindow) return

  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.currentX = bounds.x
  state.currentY = bounds.y
}

function handleWindowResize(): void {
  if (!state.mainWindow) return

  const bounds = state.mainWindow.getBounds()
  state.windowSize = { width: bounds.width, height: bounds.height }
}

function handleWindowClose(): void {
  state.mainWindow = null
  state.isWindowVisible = false
  state.windowPosition = null
  state.windowSize = null
}

function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!state.mainWindow) return
  state.currentX = updateFn(state.currentX)
  state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow) return

  const newY = updateFn(state.currentY)

  const maxUpLimit = (-(state.windowSize?.height || 0) * 2) / 3
  const maxDownLimit = state.screenHeight + ((state.windowSize?.height || 0) * 2) / 3

  console.log({
    newY,
    maxUpLimit,
    maxDownLimit,
    screenHeight: state.screenHeight,
    windowHeight: state.windowSize?.height,
    currentY: state.currentY
  })

  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY
    state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
  }
}

function initializeHelpers() {
  state.keyboardShortcuts = new KeyboardShortcutsHelper({
    moveWindowLeft: () =>
      moveWindowHorizontal((x) => Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)),
    moveWindowRight: () =>
      moveWindowHorizontal((x) =>
        Math.min(state.screenWidth - (state.windowSize?.width || 0) / 2, x + state.step)
      ),
    moveWindowUp: () => moveWindowVertical((y) => y - state.step),
    moveWindowDown: () => moveWindowVertical((y) => y + state.step)
  })
}

async function initializeApp() {
  try {
    // app.on('browser-window-created', (_, window) => {
    //   optimizer.watchWindowShortcuts(window)
    // })

    initializeIpcHandler()
    initializeHelpers()
    createWindow()
    state.keyboardShortcuts?.registerGlobalShortcuts()
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
