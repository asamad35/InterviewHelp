import { useCallback, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'
import { WelcomeScreen } from './components/welcome-screen'
import { SettingDialog } from './components/setting-dialog'
import { MainApp } from './components/main-app'

function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  const markInitialized = useCallback(() => {
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    const intializeApp = async () => {
      try {
        const config = await window.electronAPI.getConfig()
        console.log('config', config)
        markInitialized()
      } catch (error) {
        console.error('Failed to toggle main window', error)
      }
    }
    intializeApp()

    return () => {
      setIsInitialized(false)
    }
  }, [markInitialized])

  return (
    <QueryProvider>
      <Toaster richColors />
      <div className="relative">
        {isInitialized ? (
          <MainApp currentLanguage={'python'} setLanguage={() => {}} />
        ) : (
          <WelcomeScreen onOpenSettings={handleOpenSettings} />
        )}
      </div>
      <SettingDialog open={isSettingsOpen} onOpenChange={handleCloseSettings} />
    </QueryProvider>
  )
}

export default App
