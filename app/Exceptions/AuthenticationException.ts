import { Exception } from '@adonisjs/core/build/standalone'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { BasicErrorResponse } from 'App/Exceptions/types'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new AuthenticationException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class AuthenticationException extends Exception {
  public async handle(error, { response }: HttpContextContract) {
    /*return response.status(401).json({
      error: 'Authentication error',
      message: error.message,
    })*/
    return response.unauthorized({
      code: 401,
      error: 'Authentication error',
      message: error.message,
    } as BasicErrorResponse)
  }

  // public report(error: this, ctx: HttpContextContract) {}
}
