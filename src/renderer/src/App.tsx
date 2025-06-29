import { useCallback, useState } from 'react'
import { Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'
import { WelcomeScreen } from './components/welcome-screen'
import { SettingDialog } from './components/setting-dialog'

function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  return (
    <QueryProvider>
      <Toaster richColors />
      <div className="relative">
        <WelcomeScreen onOpenSettings={handleOpenSettings} />
      </div>
      <SettingDialog open={isSettingsOpen} onOpenChange={handleCloseSettings} />
    </QueryProvider>
  )
}

export default App
