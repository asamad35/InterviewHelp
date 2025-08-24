import { TVIEW } from '@/common/utils'
import { useEffect, useRef, useState } from 'react'
import { ScreenshotsView } from './screenshots-view'
import { useQueryClient } from '@tanstack/react-query'
import Solutions from './solution'

interface MainAppProps {
  currentLanguage: string
  setLanguage: (language: string) => void
}

export const MainApp = ({ currentLanguage, setLanguage }: MainAppProps) => {
  const [view, setView] = useState<TVIEW>('queue')
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const cleanupFunction = [
      window.electronAPI.onSolutionStart(() => {
        setView('solutions')
      }),
      window.electronAPI.onProblemExtracted((data: { problem: string; solution: string }) => {
        console.log('problem-statement', data)
        if (view === 'queue') {
          queryClient.invalidateQueries({ queryKey: ['problem-statement'] })
          queryClient.setQueryData(['problem-statement'], data)
        }
      })
    ]

    return () => {
      cleanupFunction.forEach((cleanup) => cleanup())
    }
  }, [view])

  return (
    <div ref={containerRef} className="min-h-0">
      {view === 'queue' ? (
        <ScreenshotsView
          setView={setView}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
      ) : view === 'solutions' ? (
        <Solutions setView={setView} currentLanguage={currentLanguage} setLanguage={setLanguage} />
      ) : null}
    </div>
  )
}
