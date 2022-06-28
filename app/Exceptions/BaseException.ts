import { Exception } from '@adonisjs/core/build/standalone'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { BasicErrorResponse, ValidationErrorResponse } from 'App/Exceptions/types'
import { logRouteError } from 'App/utils/logger'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new BaseException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class BaseException extends Exception {
  protected response: BasicErrorResponse | ValidationErrorResponse

  public async handle(error: this, { response }: HttpContextContract) {
    switch (error.response.code) {
      case 401:
        return response.unauthorized(error.response)
      case 403:
        return response.forbidden(error.response)
      case 404:
        return response.notFound(error.response)
      case 422:
        return response.unprocessableEntity(error.response)
      default:
        return response.badRequest(error.response)
    }
  }

  public report(error: this, { request }: HttpContextContract) {
    let logMessage = `${error.response.error}: `

    const basicErrorResponse = error.response as BasicErrorResponse
    if (basicErrorResponse.message) {
      logMessage += basicErrorResponse.message
    }
    const validationErrorResponse = error.response as ValidationErrorResponse
    if (validationErrorResponse.fields) {
      validationErrorResponse.fields.forEach((field, index) => {
        if (index === 0) {
          logMessage += `${field.error} from ${field.name} field`
        } else {
          logMessage += `, ${field.error} from ${field.name} field`
        }
      })
    }

    logRouteError(request, error.response.code, logMessage)
  }
}
