import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import screenshot from 'screenshot-desktop'
import { v4 as uuidv4 } from 'uuid'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { TVIEW } from '@/common/utils'

export class ScreenshotManager {
  private screenshotQueue: string[] = []
  private extraScreenshotQueue: string[] = []
  private readonly MAX_SCREENSHOTS = 5

  private readonly screenshotDir: string
  private readonly extraScreenshotDir: string
  private readonly tempDir: string

  private view: TVIEW = 'queue'

  constructor(view: TVIEW = 'queue') {
    this.view = view
    this.screenshotDir = path.join(app.getPath('userData'), 'screenshots')
    this.extraScreenshotDir = path.join(app.getPath('userData'), 'extra-screenshots')
    this.tempDir = path.join(app.getPath('userData'), 'temp')

    this.ensureDirectoriesExists()
    this.cleanScreenshotDirectories()
  }

  public getView(): TVIEW {
    return this.view
  }

  public setView(view: TVIEW): void {
    this.view = view
  }

  public getScreenShotQueue(): string[] {
    return this.screenshotQueue
  }

  public getExtraScreenShotQueue(): string[] {
    return this.extraScreenshotQueue
  }

  public clearQueues(): void {
    const queues = [this.screenshotQueue, this.extraScreenshotQueue]
    queues.forEach((queue) => {
      queue.forEach((file) => {
        try {
          fs.unlinkSync(file)
          console.log(`Deleted screenshot file: ${file}`)
        } catch (error) {
          console.error(`Error deleting file: ${file}`, error)
        }
      })
    })
    this.screenshotQueue = []
    this.extraScreenshotQueue = []

    console.log('Queues cleared successfully')
  }

  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    console.log('taking screenshot', this.view)
    hideMainWindow()

    const hideDelay = process.platform === 'win32' ? 500 : 300
    await new Promise((resolve) => setTimeout(resolve, hideDelay))
    let screenshotPath = ''
    try {
      const screenshotBuffer = await this.captureScreenshot()
      if (!screenshotBuffer || screenshotBuffer.length === 0) {
        throw new Error('Failed to capture screenshot')
      }
      if (this.view === 'queue') {
        screenshotPath = path.join(this.screenshotDir, `screenshot-${uuidv4()}.png`)
        await fs.promises.writeFile(screenshotPath, screenshotBuffer)
        console.log('Screenshot saved to', screenshotPath)
        this.screenshotQueue.push(screenshotPath)
        if (this.screenshotQueue.length >= this.MAX_SCREENSHOTS) {
          const removedPath = this.screenshotQueue.shift()
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath)
              console.log('Removed old screenshot file', removedPath)
            } catch (error) {
              console.error('Error removing old screenshot file', error)
            }
          }
        }
      } else {
        screenshotPath = path.join(this.extraScreenshotDir, `screenshot-${uuidv4()}.png`)
        await fs.promises.writeFile(screenshotPath, screenshotBuffer)
        console.log('Screenshot saved to', screenshotPath)
        this.extraScreenshotQueue.push(screenshotPath)
        if (this.extraScreenshotQueue.length >= this.MAX_SCREENSHOTS) {
          const removedPath = this.extraScreenshotQueue.shift()
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath)
              console.log('Removed old extra screenshot file', removedPath)
            } catch (error) {
              console.error('Error removing old extra screenshot file', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error capturing screenshot', error)
      throw error
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 200))
      showMainWindow()
    }
    return screenshotPath
  }

  public async getImagePreview(screenshotPath: string): Promise<string> {
    try {
      if (!fs.existsSync(screenshotPath)) {
        throw new Error('Screenshot file does not exist')
      }
      const imageData = await fs.promises.readFile(screenshotPath)
      const base64Image = imageData.toString('base64')
      return `data:image/png;base64,${base64Image}`
    } catch (error) {
      console.error('Error getting image preview', error)
      return ''
    }
  }

  public async deleteScreenshot(
    screenshotPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (fs.existsSync(screenshotPath)) {
        await fs.promises.unlink(screenshotPath)
      }
      if (this.view === 'queue') {
        this.screenshotQueue = this.screenshotQueue.filter((path) => path !== screenshotPath)
      } else if (this.view === 'solutions') {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (path) => path !== screenshotPath
        )
      }
      return { success: true }
    } catch (error) {
      console.error('Error deleting screenshot', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public clearExtraScreenshotQueue(): void {
    this.extraScreenshotQueue.forEach((path) => {
      if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if (err) {
            console.error(`Error deleting file: ${path}`, err)
          }
        })
      }
    })
    this.extraScreenshotQueue = []
  }

  private async captureScreenshot(): Promise<Buffer> {
    try {
      console.log('starting screenshot capture')

      if (process.platform === 'win32') {
        return await this.captureWindowsScreenshot()
      }

      console.log('Capturing screenshot for non-windows platform')
      const buffer = await screenshot({
        format: 'png'
      })

      console.log('Screenshot captured successfully')
      return buffer
    } catch (error) {
      console.error('Error capturing screenshot', error)
      throw error
    }
  }

  private async captureWindowsScreenshot(): Promise<Buffer> {
    try {
      console.log('Starting Windows screenshot capture...')

      const tempFilePath = path.join(this.tempDir, `temp-${uuidv4()}.png`)
      await screenshot({
        path: tempFilePath
      })

      if (fs.existsSync(tempFilePath)) {
        const buffer = await fs.promises.readFile(tempFilePath)

        try {
          await fs.promises.unlink(tempFilePath)
        } catch (error) {
          console.error('Failed to delete temp file:', error)
        }

        console.log('Screenshot captured successfully')
        return buffer
      } else {
        console.error('Failed to capture screenshot: Temp file not found')
        throw new Error('Failed to capture screenshot')
      }
    } catch (error) {
      console.error('Failed to capture Windows screenshot:', error)

      try {
        console.log('Trying powrshell method')
        const tempFilePath = path.join(this.tempDir, `temp-${uuidv4()}.png`)

        const psScript = `
         Add-Type -AssemblyName System.Windows.Forms,System.Drawing
         $screens = [System.Windows.Forms.Screen]::AllScreens
         $top = ($screens | ForEach-Object {$_.Bounds.Top} | Measure-Object -Minimum).Minimum
         $left = ($screens | ForEach-Object {$_.Bounds.Left} | Measure-Object -Minimum).Minimum
         $width = ($screens | ForEach-Object {$_.Bounds.Right} | Measure-Object -Maximum).Maximum
         $height = ($screens | ForEach-Object {$_.Bounds.Bottom} | Measure-Object -Maximum).Maximum
         $bounds = [System.Drawing.Rectangle]::FromLTRB($left, $top, $width, $height)
         $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
         $graphics = [System.Drawing.Graphics]::FromImage($bmp)
         $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size)
         $bmp.Save('${tempFilePath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
         $graphics.Dispose()
         $bmp.Dispose()
         `

        await promisify(execFile)('powershell', [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          psScript
        ])

        if (fs.existsSync(tempFilePath)) {
          const buffer = await fs.promises.readFile(tempFilePath)

          try {
            await fs.promises.unlink(tempFilePath)
          } catch (error) {
            console.error('Failed to delete temp file:', error)
          }

          console.log('Screenshot captured successfully')
          return buffer
        } else {
          console.error('Failed to capture screenshot: Temp file not found')
          throw new Error('Failed to capture screenshot')
        }
      } catch (error) {
        console.error('Failed to capture screenshot using PowerShell:', error)
        throw error
      }
    }
  }

  private ensureDirectoriesExists(): void {
    const dirs = [this.screenshotDir, this.extraScreenshotDir, this.tempDir]
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        try {
          console.log(`Creating directory: ${dir}`)
          fs.mkdirSync(dir, { recursive: true })
        } catch (error) {
          console.error(`Error creating directory: ${dir}`, error)
        }
      }
    })
  }

  private cleanScreenshotDirectories(): void {
    const dirs = [this.screenshotDir, this.extraScreenshotDir]

    dirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        const filesPath = fs
          .readdirSync(dir)
          .filter((file) => file.endsWith('.png'))
          .map((file) => path.join(dir, file))

        filesPath.forEach((filePath) => {
          try {
            fs.unlinkSync(filePath)
            console.log(`Deleted screenshot file: ${filePath}`)
          } catch (error) {
            console.error(`Error deleting file: ${filePath}`, error)
          }
        })
      }
    })
  }
}
