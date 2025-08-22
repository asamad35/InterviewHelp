import { useCallback, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'
import { WelcomeScreen } from './components/welcome-screen'
import { SettingDialog } from './components/setting-dialog'
import { MainApp } from './components/main-app'
import { AIModel, APIProvider } from '@/common/utils'

interface AppConfig {
  apiKey?: string
  apiProvider?: APIProvider
  extractionModel?: AIModel
  solutionModel?: AIModel
  debuggingModel?: AIModel
  language?: string
}

function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('python')

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  const markInitialized = useCallback(() => {
    setIsInitialized(true)
    window.__IS_INITIALIZED__ = true
  }, [])

  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language)
    window.__LANGUAGE__ = language
  }, [])

  useEffect(() => {
    const intializeApp = async () => {
      try {
        const config = (await window.electronAPI.getConfig()) as AppConfig
        console.log('config', config)
        if (config?.language) {
          setCurrentLanguage(config.language)
        }
        markInitialized()
      } catch (error) {
        console.error('Failed to toggle main window', error)
      }
    }
    intializeApp()

    return () => {
      window.__IS_INITIALIZED__ = false
      setIsInitialized(false)
    }
  }, [markInitialized])

  return (
    <QueryProvider>
      <Toaster richColors />
      <div className="relative">
        {isInitialized ? (
          <MainApp currentLanguage={currentLanguage} setLanguage={handleLanguageChange} />
        ) : (
          <WelcomeScreen onOpenSettings={handleOpenSettings} />
        )}
      </div>
      <SettingDialog open={isSettingsOpen} onOpenChange={handleCloseSettings} />
    </QueryProvider>
  )
}

export default App
