import { useCallback, useState } from 'react'
import { Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'
import { WelcomeScreen } from './components/welcome-screen'

function App(): React.JSX.Element {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  return (
    <QueryProvider>
      <Toaster richColors />
      <div className="relative">
        <WelcomeScreen onOpenSettings={handleOpenSettings} />
      </div>
    </QueryProvider>
  )
}

export default App
