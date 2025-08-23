import type { Config } from '../common/utils'

export interface ElectronAPI {
  getConfig: () => Promise<Config>
  updateConfig: (config: Config) => Promise<boolean>
  checkApiKey: () => Promise<boolean>
  validateApiKey: (apiKey: string) => Promise<{
    valid: boolean
    error?: string
  }>
  getScreenshots: () => Promise<{ path: string; preview: string }[]>
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void
  toggleMainWindow: () => Promise<{ success: boolean; error?: string }>
  getPlatform: () => string
  deleteLastScreenshot: () => Promise<{ success: boolean; error?: string }>
  openSettingsPortal: () => Promise<{ success: boolean; error?: string }>
  triggerScreenshot: () => Promise<{ success: boolean; error?: string }>
  onDeleteLastScreenshot: (callback: () => void) => () => void
  onShowSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    __LANGUAGE__: string
    __IS_INITIALIZED__: boolean
  }
}
