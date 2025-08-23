import { TVIEW } from '@/common/utils'
import { useEffect, useRef, useState } from 'react'
import ScreenshotQueue from './queue/screenshot-queue'
import { useQuery } from '@tanstack/react-query'
import { QueueCommand } from './queue/queue-command'
import { toast } from 'sonner'

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotsViewProps {
  setView: (view: TVIEW) => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

async function fetchScreenshots() {
  try {
    const existing = await window.electronAPI.getScreenshots()
    return existing
  } catch (error) {
    console.error('Error fetching screenshots:', error)
    throw error
  }
}

export const ScreenshotsView = ({
  setView,
  currentLanguage,
  setLanguage
}: ScreenshotsViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const {
    data: screenshots = [],
    isLoading,
    refetch
  } = useQuery<Screenshot[]>({
    queryKey: ['screenshots'],
    queryFn: fetchScreenshots,
    staleTime: 1,
    gcTime: Infinity,
    refetchOnWindowFocus: false
  })

  console.log('screenshots', screenshots)

  useEffect(() => {
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onDeleteLastScreenshot(async () => {
        if (screenshots.length > 0) {
          await handleDeleteScreenshot(screenshots.length - 1)
        } else {
          toast.error('No screenshots to delete')
        }
      })
    ]

    return () => {
      console.log('cleanupFunctions', cleanupFunctions)
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [screenshots])

  const handleDeleteScreenshot = async (index: number) => {
    try {
      const response = await window.electronAPI.deleteScreenshot(screenshots[index].path)
      if (response.success) {
        refetch()
      } else {
        console.error('Error deleting screenshot:', response.error)
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error)
    }
  }

  return (
    <div ref={containerRef} className="bg-transparent w-1/2">
      <div className="px-4 py-3">
        <div className="space-y-3 w-fit">
          <ScreenshotQueue
            screenshots={screenshots}
            onDeleteScreenshot={handleDeleteScreenshot}
            isLoading={isLoading}
          />
          <QueueCommand
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
            screenshotCount={screenshots.length}
          />
        </div>
      </div>
    </div>
  )
}
