import Logger from '@ioc:Adonis/Core/Logger'
import type { RequestContract } from '@ioc:Adonis/Core/Request'

/*const logInfo = (message: string) => {
  Logger.info(message)
}*/

export const logSuccess = (message: string) => {
  Logger.info(message)
}

/*const logWarning = (message: string) => {
  Logger.warn(message)
}*/

const logError = (message: string) => {
  Logger.error(message)
}

export const logRouteSuccess = (request: RequestContract, message: string) => {
  logSuccess(`[Success ${request.method()} ${request.url(true)}] ${message}`)
}

export const logRouteError = (request: RequestContract, code: number, message: string) => {
  logError(`[Error ${request.method()} ${request.url(true)}] ${code} ${message}`)
}
