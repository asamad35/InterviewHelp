import { BrowserWindow, globalShortcut } from 'electron'
import { TVIEW } from '@/common/utils'

interface IKeyboardShortcutsHelper {
  moveWindowUp: () => void
  moveWindowDown: () => void
  moveWindowLeft: () => void
  moveWindowRight: () => void
  toggleMainWindow: () => void
  isVisible: () => boolean
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (screenshotPath: string) => Promise<string>
  clearQueues: () => void
  setView: (view: TVIEW) => void
}

export class KeyboardShortcutsHelper {
  private deps: IKeyboardShortcutsHelper

  constructor(deps: IKeyboardShortcutsHelper) {
    this.deps = deps
  }

  public registerGlobalShortcuts() {
    globalShortcut.register('CommandOrControl+Up', () => {
      console.log('move window up')
      this.deps.moveWindowUp()
    })
    globalShortcut.register('CommandOrControl+Down', () => {
      console.log('move window down')
      this.deps.moveWindowDown()
    })
    globalShortcut.register('CommandOrControl+Left', () => {
      console.log('move window left')
      this.deps.moveWindowLeft()
    })
    globalShortcut.register('CommandOrControl+Right', () => {
      console.log('move window right')
      this.deps.moveWindowRight()
    })
    globalShortcut.register('CommandOrControl+B', () => {
      console.log('toggle main window')
      this.deps.toggleMainWindow()
    })
    globalShortcut.register('CommandOrControl+H', async () => {
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        console.log('hiding main window')
        try {
          const screenshotPath = await this.deps.takeScreenshot()
          const imagePreview = await this.deps.getImagePreview(screenshotPath)
          console.log('screenshot taken', screenshotPath, imagePreview)
          mainWindow.webContents.send('screenshot-taken', {
            path: screenshotPath,
            preview: imagePreview
          })
        } catch (error) {
          console.error('Error taking screenshot', error)
        }
      }
    })
  }
}
