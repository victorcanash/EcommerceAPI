import Logger from '@ioc:Adonis/Core/Logger'

/*const LogInfo = (message: string) => {
  Logger.info(message)
}*/

const LogSuccess = (message: string) => {
  Logger.info(message)
}

/*const LogWarning = (message: string) => {
  Logger.warn(message)
}*/

const LogError = (message: string) => {
  Logger.error(message)
}

export const LogRouteSuccess = (route: string, message: string) => {
  LogSuccess(`[Success ${route}] ${message}`)
}

export const LogExceptionError = (code: number, message: string) => {
  LogError(`[Error ${code}] ${message}`)
}
