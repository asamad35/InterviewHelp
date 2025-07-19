import type { Config } from '../common/utils'

export interface ElectronAPI {
  getConfig: () => Promise<Config>
  updateConfig: (config: Config) => Promise<boolean>
  checkApiKey: () => Promise<boolean>
  validateApiKey: (apiKey: string) => Promise<{
    valid: boolean
    error?: string
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
