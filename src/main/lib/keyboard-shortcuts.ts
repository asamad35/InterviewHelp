import { globalShortcut } from 'electron'

interface IKeyboardShortcutsHelper {
  moveWindowUp: () => void
  moveWindowDown: () => void
  moveWindowLeft: () => void
  moveWindowRight: () => void
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
  }
}
