import { TVIEW } from '@/common/utils'
import { useRef, useState } from 'react'
import { ScreenshotsView } from './screenshots-view'

interface MainAppProps {
  currentLanguage: string
  setLanguage: (language: string) => void
}

export const MainApp: React.FC<MainAppProps> = ({ currentLanguage, setLanguage }) => {
  const [view, setView] = useState<TVIEW>('queue')
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="min-h-0">
      {view === 'queue' ? (
        <ScreenshotsView
          setView={setView}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
      ) : view === 'solutions' ? (
        <>Solutions View</>
      ) : null}
    </div>
  )
}
