import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const getPlatform = () => {
  try {
    return window.electronAPI.getPlatform() || 'win32'
  } catch (error: unknown) {
    console.error('Failed to get platform', error)
    return 'win32'
  }
}
export const COMMAND_KEY = getPlatform() === 'win32' ? 'ctrl' : 'command'
