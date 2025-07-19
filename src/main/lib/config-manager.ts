import { APIProvider, AIModel, CONSTANTS, Config } from '@/common/utils'
import { app } from 'electron'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import OpenAI from 'openai'

export class ConfigManager extends EventEmitter {
  private configPath: string
  private defaultConfig: Config = {
    apiKey: '',
    apiProvider: CONSTANTS.API_PROVIDERS.OPENAI,
    extractionModel: CONSTANTS.AI_MODELS.GPT_4O_MINI,
    solutionModel: CONSTANTS.AI_MODELS.GPT_4O_MINI,
    debuggingModel: CONSTANTS.AI_MODELS.GPT_4O_MINI,
    language: 'javascript',
    opacity: 1.0
  }

  constructor() {
    super()
    try {
      this.configPath = path.join(app.getPath('userData'), 'config.json')
      console.log('Config path:', this.configPath)
    } catch (error) {
      console.error('Error getting config path:', error)
      this.configPath = path.join(process.cwd(), 'config.json')
    }
    this.ensureConfigFileExists()
  }

  private ensureConfigFileExists(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.saveConfig(this.defaultConfig)
        console.log('Created default config file:', this.configPath)
      }
    } catch (error) {
      console.error('Failed to ensure config file exists:', error)
    }
  }

  public saveConfig(config: Config): void {
    try {
      const configDir = path.dirname(this.configPath)
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  private sanitizeModelSelection(model: AIModel, provider: APIProvider): AIModel {
    if (provider === CONSTANTS.API_PROVIDERS.OPENAI) {
      const allowedModels: AIModel[] = [CONSTANTS.AI_MODELS.GPT_4O_MINI, CONSTANTS.AI_MODELS.GPT_4O]
      if (!allowedModels.includes(model)) {
        console.log(
          `Invalid model: ${model} for provider: ${provider}. Defaulting to ${CONSTANTS.AI_MODELS.GPT_4O}`
        )
        return CONSTANTS.AI_MODELS.GPT_4O
      }
      return model
    } else if (provider === CONSTANTS.API_PROVIDERS.GEMINI) {
      const allowedModels: AIModel[] = [
        CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        CONSTANTS.AI_MODELS.GEMINI_1_5_PRO
      ]
      if (!allowedModels.includes(model)) {
        console.log(
          `Invalid model: ${model} for provider: ${provider}. Defaulting to ${CONSTANTS.AI_MODELS.GEMINI_1_5_PRO}`
        )
        return CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH
      }
      return model
    }
    return model
  }

  public loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8')
        const config = JSON.parse(configData)

        if (
          config.apiProvider !== CONSTANTS.API_PROVIDERS.OPENAI &&
          config.apiProvider !== CONSTANTS.API_PROVIDERS.GEMINI
        ) {
          console.log(`Invalid API provider. Defaulting to ${CONSTANTS.API_PROVIDERS.OPENAI}`)
          config.apiProvider = CONSTANTS.API_PROVIDERS.OPENAI
        }

        if (config.extractionModel) {
          config.extractionModel = this.sanitizeModelSelection(
            config.extractionModel,
            config.apiProvider
          )
        }

        if (config.solutionModel) {
          config.solutionModel = this.sanitizeModelSelection(
            config.solutionModel,
            config.apiProvider
          )
        }

        if (config.debuggingModel) {
          config.debuggingModel = this.sanitizeModelSelection(
            config.debuggingModel,
            config.apiProvider
          )
        }

        return {
          ...this.defaultConfig,
          ...config
        }
      }

      this.saveConfig(this.defaultConfig)
      return this.defaultConfig
    } catch (error) {
      console.error('Failed to load config:', error)
      return this.defaultConfig
    }
  }

  public updateConfig(updates: Partial<Config>): Config {
    try {
      const currentConfig = this.loadConfig()
      let provider = updates.apiProvider || currentConfig.apiProvider

      if (updates.apiKey && !updates.apiProvider) {
        if (updates.apiKey.trim().startsWith('sk-')) {
          provider = CONSTANTS.API_PROVIDERS.OPENAI
          console.log(
            `Detected OpenAI API key. Setting provider to ${CONSTANTS.API_PROVIDERS.OPENAI}`
          )
        } else {
          provider = CONSTANTS.API_PROVIDERS.GEMINI
          console.log(
            `Detected Gemini API key. Setting provider to ${CONSTANTS.API_PROVIDERS.GEMINI}`
          )
        }
      }

      updates.apiProvider = provider

      if (updates.apiProvider && updates.apiProvider !== currentConfig.apiProvider) {
        if (updates.apiProvider === CONSTANTS.API_PROVIDERS.OPENAI) {
          updates.extractionModel = CONSTANTS.AI_MODELS.GPT_4O
          updates.solutionModel = CONSTANTS.AI_MODELS.GPT_4O
          updates.debuggingModel = CONSTANTS.AI_MODELS.GPT_4O
        } else {
          updates.extractionModel = CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH
          updates.solutionModel = CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH
          updates.debuggingModel = CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH
        }
      }

      if (updates.extractionModel && updates.apiProvider) {
        updates.extractionModel = this.sanitizeModelSelection(
          updates.extractionModel,
          updates.apiProvider
        )
      }
      if (updates.solutionModel && updates.apiProvider) {
        updates.solutionModel = this.sanitizeModelSelection(
          updates.solutionModel,
          updates.apiProvider
        )
      }
      if (updates.debuggingModel && updates.apiProvider) {
        updates.debuggingModel = this.sanitizeModelSelection(
          updates.debuggingModel,
          updates.apiProvider
        )
      }

      const newConfig = {
        ...currentConfig,
        ...updates
      }

      this.saveConfig(newConfig)

      if (
        updates.apiKey !== undefined ||
        updates.apiProvider !== undefined ||
        updates.extractionModel !== undefined ||
        updates.solutionModel !== undefined ||
        updates.debuggingModel !== undefined ||
        updates.language !== undefined
      ) {
        this.emit('config-updated', newConfig)
      }

      return newConfig
    } catch (error) {
      console.error('Failed to update config:', error)
      return this.defaultConfig
    }
  }

  public hasApiKey(): boolean {
    const config = this.loadConfig()
    return !!config.apiKey && config.apiKey.trim().length > 0
  }

  public isValidApiKeyFormat(apiKey: string, provider?: APIProvider): boolean {
    if (!provider) {
      if (apiKey.trim().startsWith('sk-')) {
        provider = CONSTANTS.API_PROVIDERS.OPENAI
      } else {
        provider = CONSTANTS.API_PROVIDERS.GEMINI
      }
    }

    if (provider === CONSTANTS.API_PROVIDERS.OPENAI) {
      return /^sk-\w{48}$/.test(apiKey)
    } else if (provider === CONSTANTS.API_PROVIDERS.GEMINI) {
      return /^AIzaSyB.*$/.test(apiKey)
    }
    return false
  }

  public async testApiKey(
    apiKey: string,
    provider?: APIProvider
  ): Promise<{
    valid: boolean
    error?: string
  }> {
    if (!provider) {
      if (apiKey.trim().startsWith('sk-')) {
        provider = CONSTANTS.API_PROVIDERS.OPENAI
      } else {
        provider = CONSTANTS.API_PROVIDERS.GEMINI
      }
    }

    if (provider === CONSTANTS.API_PROVIDERS.OPENAI) {
      return this.testOpenAiKey(apiKey)
    } else if (provider === CONSTANTS.API_PROVIDERS.GEMINI) {
      return this.testGeminiKey(apiKey)
    }

    return { valid: false, error: 'Invalid provider' }
  }

  private async testOpenAiKey(apiKey: string): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      const openai = new OpenAI({
        apiKey
      })

      await openai.models.list()
      return { valid: true }
    } catch (error) {
      console.error('OpenAI API key test failed:', error)
      return { valid: false, error: 'Invalid API key' }
    }
  }

  private async testGeminiKey(apiKey: string): Promise<{
    valid: boolean
    error?: string
  }> {
    try {
      // TODO: Implement Gemini API key test
      console.log('Testing Gemini API key:', apiKey)
      return { valid: true }
    } catch (error) {
      console.error('Gemini API key test failed:', error)
      return { valid: false, error: 'Invalid API key' }
    }
  }
}

export const configManager = new ConfigManager()
