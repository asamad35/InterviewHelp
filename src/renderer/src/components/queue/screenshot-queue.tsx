import { ScreenshotItem } from './screenshot-item'

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotQueueProps {
  screenshots: Screenshot[]
  onDeleteScreenshot: (index: number) => void
  isLoading: boolean
}

const ScreenshotQueue = ({ screenshots, onDeleteScreenshot, isLoading }: ScreenshotQueueProps) => {
  if (screenshots.length === 0) return <></>

  const displayScreenShot = screenshots.slice(0, 5)

  return (
    <div className="flex gap-4">
      {displayScreenShot.map((screenshot, index) => (
        <ScreenshotItem
          key={screenshot.path}
          screenshot={screenshot}
          onDelete={onDeleteScreenshot}
          index={index}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}

export default ScreenshotQueue
