import { Config } from '../common/utils'
import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config: Config) => ipcRenderer.invoke('update-config', config),
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('validate-api-key', apiKey)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
