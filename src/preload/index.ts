import { Config } from '../common/utils'
import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config: Config) => ipcRenderer.invoke('update-config', config),
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('validate-api-key', apiKey),
  getScreenshots: () => ipcRenderer.invoke('get-screenshots'),
  deleteScreenshot: (path: string) => ipcRenderer.invoke('delete-screenshot', path),
  toggleMainWindow: async () => {
    console.log('toggleMainWindow called from preload')
    try {
      const result = await ipcRenderer.invoke('toggle-main-window')
      console.log('toggleMainWindow result', result)
      return result
    } catch (error) {
      console.error('toggleMainWindow error', error)
      throw error
    }
  },
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => {
    const subscription = (_: unknown, data: { path: string; preview: string }) => callback(data)
    ipcRenderer.on('screenshot-taken', subscription)
    return () => ipcRenderer.removeListener('screenshot-taken', subscription)
  },
  getPlatform: () => process.platform
}
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
