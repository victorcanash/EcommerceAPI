import Logger from '@ioc:Adonis/Core/Logger'

export const LogInfo = (message: string) => {
  Logger.info(message)
}

export const LogSuccess = (message: string) => {
  Logger.info(message)
}

export const LogWarning = (message: string) => {
  Logger.warn(message)
}

export const LogError = (message: string) => {
  Logger.error(message)
}
