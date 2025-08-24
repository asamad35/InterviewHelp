import { app, BrowserWindow, globalShortcut } from 'electron'
import { TVIEW } from '@/common/utils'
import { ProcessingManager } from './processing-manager'
import { configManager } from './config-manager'

interface IKeyboardShortcutsHelper {
  moveWindowUp: () => void
  moveWindowDown: () => void
  moveWindowLeft: () => void
  moveWindowRight: () => void
  toggleMainWindow: () => void
  isVisible: () => boolean
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (screenshotPath: string) => Promise<string>
  clearQueues: () => void
  setView: (view: TVIEW) => void
  processingManager: ProcessingManager | null
}

export class KeyboardShortcutsHelper {
  private deps: IKeyboardShortcutsHelper

  constructor(deps: IKeyboardShortcutsHelper) {
    this.deps = deps
  }

  private adjustOpacity(delta: number): void {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return

    const currentOpacity = mainWindow.getOpacity()
    const newOpacity = Math.max(0.1, Math.min(1, currentOpacity + delta))
    console.log('adjusting opacity', currentOpacity, newOpacity)
    mainWindow.setOpacity(newOpacity)

    try {
      const config = configManager.loadConfig()
      config.opacity = newOpacity
      configManager.saveConfig(config)
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  public registerGlobalShortcuts() {
    globalShortcut.register('CommandOrControl+Up', () => {
      console.log('move window up')
      this.deps.moveWindowUp()
    })
    globalShortcut.register('CommandOrControl+Down', () => {
      console.log('move window down')
      this.deps.moveWindowDown()
    })
    globalShortcut.register('CommandOrControl+Left', () => {
      console.log('move window left')
      this.deps.moveWindowLeft()
    })
    globalShortcut.register('CommandOrControl+Right', () => {
      console.log('move window right')
      this.deps.moveWindowRight()
    })
    globalShortcut.register('CommandOrControl+B', () => {
      console.log('toggle main window')
      this.deps.toggleMainWindow()
    })
    globalShortcut.register('CommandOrControl+H', async () => {
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        console.log('hiding main window')
        try {
          const screenshotPath = await this.deps.takeScreenshot()
          const imagePreview = await this.deps.getImagePreview(screenshotPath)
          console.log('screenshot takennn', screenshotPath, imagePreview.slice(0, 30))
          mainWindow.webContents.send('screenshot-taken', {
            path: screenshotPath,
            preview: imagePreview
          })
        } catch (error) {
          console.error('Error taking screenshot', error)
        }
      }
    })
    globalShortcut.register('CommandOrControl+Enter', async () => {
      await this.deps.processingManager?.processScreenshots()
    })
    globalShortcut.register('CommandOrControl+[', () => {
      console.log('decreaseOpacity')
      this.adjustOpacity(-0.1)
    })
    globalShortcut.register('CommandOrControl+]', () => {
      console.log('increaseOpacity')
      this.adjustOpacity(0.1)
    })
    globalShortcut.register('CommandOrControl+-', () => {
      console.log('zoom out')
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        const currentZoom = mainWindow.webContents.getZoomLevel()
        mainWindow.webContents.setZoomLevel(currentZoom - 0.5)
      }
    })
    globalShortcut.register('CommandOrControl+=', () => {
      console.log('zoom in')
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        const currentZoom = mainWindow.webContents.getZoomLevel()
        mainWindow.webContents.setZoomLevel(currentZoom + 0.5)
      }
    })
    globalShortcut.register('CommandOrControl+0', () => {
      console.log('resetZoom')
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.setZoomLevel(1)
      }
    })
    globalShortcut.register('CommandOrControl+Q', () => {
      console.log('quit')
      app.quit()
    })
    globalShortcut.register('CommandOrControl+R', () => {
      console.log('Cancel ongoing request')
      this.deps.processingManager?.cancelOngoingRequest()

      this.deps.clearQueues()
      this.deps.setView('queue')

      const mainWindow = this.deps.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('reset-view')
      }
    })
  }
}
