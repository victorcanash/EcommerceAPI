import Logger from '@ioc:Adonis/Core/Logger'
import type { RequestContract } from '@ioc:Adonis/Core/Request'

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

export const LogRouteSuccess = (request: RequestContract, message: string) => {
  LogSuccess(`[Success ${request.method()} ${request.url(true)}] ${message}`)
}

export const LogRouteError = (request: RequestContract, code: number, message: string) => {
  LogError(`[Error ${request.method()} ${request.url(true)}] ${code} ${message}`)
}
