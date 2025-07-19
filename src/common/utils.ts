export const CONSTANTS = {
  API_PROVIDERS: {
    OPENAI: 'openai',
    GEMINI: 'gemini'
  },
  AI_MODELS: {
    // openai
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    // gemini
    GEMINI_1_5_PRO: 'gemini-1.5-pro',
    GEMINI_2_0_FLASH: 'gemini-2.0-flash'
  }
} as const

export type APIProvider = (typeof CONSTANTS.API_PROVIDERS)[keyof typeof CONSTANTS.API_PROVIDERS]
export type AIModel = (typeof CONSTANTS.AI_MODELS)[keyof typeof CONSTANTS.AI_MODELS]

export interface Config {
  apiKey?: string
  apiProvider?: APIProvider
  extractionModel?: AIModel
  solutionModel?: AIModel
  debuggingModel?: AIModel
  language?: string
  opacity?: number
}
