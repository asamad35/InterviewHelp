import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Input } from './ui/input'
import { AIModel as AIModelType, APIProvider, CONSTANTS } from '@/common/utils'
import { toast } from 'sonner'

type AIModel = {
  id: AIModelType
  name: string
  description: string
}

type ModelCategory = {
  key: 'extractionModel' | 'solutionModel' | 'debuggingModel'
  title: string
  description: string
  openaiModels: AIModel[]
  geminiModels: AIModel[]
}

const modelCategories: ModelCategory[] = [
  {
    key: 'extractionModel',
    title: 'Problem Extraction',
    description: 'Model used to analyze the screenshots and extract the problem statement',
    openaiModels: [
      {
        id: CONSTANTS.AI_MODELS.GPT_4O,
        name: 'GPT-4o',
        description: 'Best overall performance for problem extraction'
      },
      {
        id: CONSTANTS.AI_MODELS.GPT_4O_MINI,
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for problem extraction'
      }
    ],
    geminiModels: [
      {
        id: CONSTANTS.AI_MODELS.GEMINI_1_5_PRO,
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for problem extraction'
      },
      {
        id: CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for problem extraction'
      }
    ]
  },
  {
    key: 'solutionModel',
    title: 'Solution Generation',
    description: 'Model used to generate the solution to the problem',
    openaiModels: [
      {
        id: CONSTANTS.AI_MODELS.GPT_4O,
        name: 'GPT-4o',
        description: 'Best overall performance for solution generation'
      },
      {
        id: CONSTANTS.AI_MODELS.GPT_4O_MINI,
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for solution generation'
      }
    ],
    geminiModels: [
      {
        id: CONSTANTS.AI_MODELS.GEMINI_1_5_PRO,
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for solution generation'
      },
      {
        id: CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for solution generation'
      }
    ]
  },
  {
    key: 'debuggingModel',
    title: 'Debugging',
    description: 'Model used to debug the solution',
    openaiModels: [
      {
        id: CONSTANTS.AI_MODELS.GPT_4O,
        name: 'GPT-4o',
        description: 'Best overall performance for debugging'
      },
      {
        id: CONSTANTS.AI_MODELS.GPT_4O_MINI,
        name: 'GPT-4o Mini',
        description: 'Faster, more cost-effective model for debugging'
      }
    ],
    geminiModels: [
      {
        id: CONSTANTS.AI_MODELS.GEMINI_1_5_PRO,
        name: 'Gemini 1.5 Pro',
        description: 'Best overall performance for debugging'
      },
      {
        id: CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        name: 'Gemini 2.0 Flash',
        description: 'Faster, more cost-effective model for debugging'
      }
    ]
  }
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const openExternalLink = (url: string) => {
  window.open(url, '_blank')
}
export function SettingDialog({ open, onOpenChange }: SettingsDialogProps) {
  // const [open, setOpen] = useState(openProp || false)
  // console.log('open', open)
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<APIProvider>(CONSTANTS.API_PROVIDERS.OPENAI)
  const [extractionModel, setExtractionModel] = useState<AIModelType>(CONSTANTS.AI_MODELS.GPT_4O)
  const [solutionModel, setSolutionModel] = useState<AIModelType>(CONSTANTS.AI_MODELS.GPT_4O)
  const [debuggingModel, setDebuggingModel] = useState<AIModelType>(CONSTANTS.AI_MODELS.GPT_4O)
  const [isLoading, setIsLoading] = useState(false)

  const maskApiKey = (key: string) => {
    if (!key) return ''
    return `${key.substring(0, 4)}....${key.substring(key.length - 4)}`
  }
  const handleProviderChange = (provider: APIProvider) => {
    setApiProvider(provider)

    if (provider === CONSTANTS.API_PROVIDERS.OPENAI) {
      setExtractionModel(CONSTANTS.AI_MODELS.GPT_4O)
      setSolutionModel(CONSTANTS.AI_MODELS.GPT_4O)
      setDebuggingModel(CONSTANTS.AI_MODELS.GPT_4O)
    } else {
      setExtractionModel(CONSTANTS.AI_MODELS.GEMINI_1_5_PRO)
      setSolutionModel(CONSTANTS.AI_MODELS.GEMINI_1_5_PRO)
      setDebuggingModel(CONSTANTS.AI_MODELS.GEMINI_1_5_PRO)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.updateConfig({
        apiKey,
        apiProvider,
        extractionModel,
        solutionModel,
        debuggingModel
      })
      if (result) {
        toast.success('Settings saved successfully')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    try {
      console.log(window.electronAPI)
      toast.error('Error fetching config')
    } finally {
      setIsLoading(false)
    }
  }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black border border-white/10 text-white w-[min(450px,90vw)] min-h-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your API key and model preferences. You&apos;ll need your own API key to use
            this application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">API Provider</label>
            <div className="flex gap-2">
              <div
                className={`flex-1 p-2 rounded-lg cursor-pointer transition-colors ${
                  apiProvider === 'openai'
                    ? 'bg-white/10 border border-white/50'
                    : 'bg-black/30 border border-white/5 hover:bg-white/5'
                }`}
                onClick={() => handleProviderChange('openai')}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      apiProvider === 'openai' ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                  <div className="flex flex-col">
                    <p className="font-medium text-white text-sm">OpenAI</p>
                    <p className="text-xs text-white/60">GPT-4o models</p>
                  </div>
                </div>
              </div>
              <div
                className={`flex-1 p-2 rounded-lg cursor-pointer transition-colors ${
                  apiProvider === 'gemini'
                    ? 'bg-white/10 border border-white/50'
                    : 'bg-black/30 border border-white/5 hover:bg-white/5'
                }`}
                onClick={() => handleProviderChange('gemini')}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      apiProvider === 'gemini' ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                  <div className="flex flex-col">
                    <p className="font-medium text-white text-sm">Gemini</p>
                    <p className="text-xs text-white/60">Gemini 1.5 models</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="apiKey">
              {apiProvider === 'openai' ? 'OpenAI API Key' : 'Google AI Studio API Key'}
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder={apiProvider === 'openai' ? 'sk-...' : 'AIza...'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-black/50 border-white/10 text-white"
            />
            {apiKey && <p className="text-xs text-white/50">Current {maskApiKey(apiKey)}</p>}
            <p className="text-xs text-white/50">
              Your API key is stored locally in your browser. It is not sent to any servers.
              {apiProvider === 'gemini' ? 'OpenAI' : 'Google'}
            </p>
            <div className="mt-2 p-2 rounded-md bg-white/5 border border-white/10">
              <p className="text-xs text-white/80 mb-1">Don&apos;t have an API key?</p>
              {apiProvider === 'openai' ? (
                <>
                  <p className="text-xs text-white/60 mb-1">
                    1. Create an account at{' '}
                    <button
                      onClick={() => openExternalLink('https://platform.openai.com/signup')}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      OpenAI
                    </button>
                  </p>
                  <p className="text-xs text-white/60 mb-1">
                    2. Go to{' '}
                    <button
                      onClick={() => openExternalLink('https://platform.openai.com/api-keys')}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      API Keys
                    </button>
                  </p>
                  <p className="text-xs text-white/60">3. Create an API key and paste it here</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/60 mb-1">
                    1. Create an account at{' '}
                    <button
                      onClick={() => openExternalLink('https://aistudio.google.com/')}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Google AI Studio
                    </button>
                  </p>
                  <p className="text-xs text-white/60 mb-1">
                    2. Go to{' '}
                    <button
                      onClick={() => openExternalLink('https://aistudio.google.com/app/apikey')}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      API Keys
                    </button>
                  </p>
                  <p className="text-xs text-white/60">3. Create an API key and paste it here</p>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium text-white mb-2 block">Keyboard Shortcuts</label>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="text-white/70">Toggle Visibility</div>
                <div className="text-white/90 font-mono">Ctrl+B / Cmd+B</div>

                <div className="text-white/70">Take Screenshot</div>
                <div className="text-white/90 font-mono">Ctrl+H / Cmd+H</div>

                <div className="text-white/70">Process Screenshot</div>
                <div className="text-white/90 font-mono">Ctrl+Enter / Cmd+Enter</div>

                <div className="text-white/70">Delete Last Screenshot</div>
                <div className="text-white/90 font-mono">Ctrl+L / Cmd+L</div>

                <div className="text-white/70">Reset View</div>
                <div className="text-white/90 font-mono">Ctrl+R / Cmd+R</div>

                <div className="text-white/70">Quit Application</div>
                <div className="text-white/90 font-mono">Ctrl+Q / Cmd+Q</div>

                <div className="text-white/70">Move Window</div>
                <div className="text-white/90 font-mono">Ctrl+Arrow Keys</div>

                <div className="text-white/70">Decrease Opacity</div>
                <div className="text-white/90 font-mono">Ctrl+[ / Cmd+[</div>

                <div className="text-white/70">Increase Opacity</div>
                <div className="text-white/90 font-mono">Ctrl+] / Cmd+]</div>

                <div className="text-white/70">Zoom Out</div>
                <div className="text-white/90 font-mono">Ctrl+- / Cmd+-</div>

                <div className="text-white/70">Zoom In</div>
                <div className="text-white/90 font-mono">Ctrl+= / Cmd+=</div>

                <div className="text-white/70">Reset Zoom</div>
                <div className="text-white/90 font-mono">Ctrl+0 / Cmd+0</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <label className="text-sm font-medium text-white">AI Model Selection</label>
            <p className="text-xs text-white/60  mb-2">
              Select which models to use for each stage of the process
            </p>
            {modelCategories.map((category) => {
              const models =
                apiProvider === 'openai' ? category.openaiModels : category.geminiModels

              return (
                <div key={category.key} className="mb-4">
                  <label className="text-sm font-medium text-white block mb-1">
                    {category.title}
                  </label>
                  <p className="text-xs text-white/60 mb-2">{category.description}</p>
                  <div className="space-y-2">
                    {models.map((m) => {
                      const currentValue =
                        category.key === 'extractionModel'
                          ? extractionModel
                          : category.key === 'solutionModel'
                            ? solutionModel
                            : debuggingModel

                      const setValue =
                        category.key === 'extractionModel'
                          ? setExtractionModel
                          : category.key === 'solutionModel'
                            ? setSolutionModel
                            : setDebuggingModel

                      return (
                        <div
                          key={m.id}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            currentValue === m.id
                              ? 'bg-white/10 border border-white/50'
                              : 'bg-black/30 border border-white/5 hover:bg-white/5'
                          }`}
                          onClick={() => setValue(m.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                currentValue === m.id ? 'bg-white' : 'bg-white/20'
                              }`}
                            />
                            <div className="flex flex-col">
                              <p className="font-medium text-white text-sm">{m.name}</p>
                              <p className="text-xs text-white/60">{m.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 hover:bg-white/5 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !apiKey}
            className="px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
