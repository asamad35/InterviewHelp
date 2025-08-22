import { BrowserWindow, ipcMain } from 'electron'
import { configManager } from './config-manager'
import { TVIEW } from '@/common/utils'

export interface IpcHandler {
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (screenshotPath: string) => Promise<string>
  clearQueues: () => void
  setView: (view: TVIEW) => void
  getView: () => TVIEW
  getScreenShotQueue: () => string[]
  getExtraScreenShotQueue: () => string[]
  moveWindowLeft: () => void
  moveWindowRight: () => void
  moveWindowUp: () => void
  moveWindowDown: () => void
  toggleMainWindow: () => void
  isVisible: () => boolean
  deleteScreenshot: (screenshotPath: string) => Promise<{ success: boolean; error?: string }>
  clearExtraScreenshotQueue: () => void
}
export function initializeIpcHandler(deps: IpcHandler): void {
  ipcMain.handle('get-config', () => {
    return configManager.loadConfig()
  })

  ipcMain.handle('update-config', (_event, updates) => {
    return configManager.updateConfig(updates)
  })

  ipcMain.handle('check-api-key', () => {
    return configManager.hasApiKey()
  })

  ipcMain.handle('validate-api-key', async (_event, apiKey) => {
    if (!configManager.isValidApiKeyFormat(apiKey)) {
      return {
        valid: false,
        error: 'Invalid API key format'
      }
    }

    const result = await configManager.testApiKey(apiKey)
    return result
  })

  ipcMain.handle('get-screenshots', async () => {
    try {
      let previews: { path: string; preview: string }[] = []
      const currentView = deps.getView()
      console.log('currentView', currentView)

      if (currentView === 'queue') {
        const queue = deps.getScreenShotQueue()
        previews = await Promise.all(
          queue.map(async (path) => {
            const preview = await deps.getImagePreview(path)
            return { path, preview }
          })
        )
        return previews
      } else {
        const queue = deps.getExtraScreenShotQueue()
        previews = await Promise.all(
          queue.map(async (path) => {
            const preview = await deps.getImagePreview(path)
            return { path, preview }
          })
        )
        return previews
      }
    } catch (error) {
      console.error('Error getting screenshot:', error)
      throw error
    }
  })

  ipcMain.handle('delete-screenshot', async (_event, path: string) => {
    try {
      const result = await deps.deleteScreenshot(path)
      return result
    } catch (error) {
      console.error('Error deleting screenshot in ipc handler:', error)
      throw error
    }
  })
}
