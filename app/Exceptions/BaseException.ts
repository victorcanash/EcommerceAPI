import { Exception } from '@adonisjs/core/build/standalone'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { BasicErrorResponse, ValidationErrorResponse } from 'App/Exceptions/types'
import { LogExceptionError } from 'App/Utils/Logger'

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
  protected errorResponse: BasicErrorResponse | ValidationErrorResponse

  public async handle(_error: any, { response }: HttpContextContract) {
    switch (this.errorResponse.code) {
      case 401:
        return response.unauthorized(this.errorResponse)
      case 403:
        return response.forbidden(this.errorResponse)
      case 404:
        return response.notFound(this.errorResponse)
      case 422:
        return response.unprocessableEntity(this.errorResponse)
      default:
        return response.badRequest(this.errorResponse)
    }
  }

  public report() {
    let logMessage = `${this.errorResponse.error}: `

    const basicErrorResponse = this.errorResponse as BasicErrorResponse
    if (basicErrorResponse.message) {
      logMessage += basicErrorResponse.message
    }
    const validationErrorResponse = this.errorResponse as ValidationErrorResponse
    if (validationErrorResponse.fields) {
      validationErrorResponse.fields.forEach((field, index) => {
        if (index === 0) {
          logMessage += `${field.error} from ${field.name} field`
        } else {
          logMessage += `, ${field.error} from ${field.name} field`
        }
      })
    }

    LogExceptionError(this.errorResponse.code, logMessage)
  }
}
