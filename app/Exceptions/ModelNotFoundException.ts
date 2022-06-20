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
| new NotFoundException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class ModelNotFoundException extends Exception {
  public async handle(error, { response }: HttpContextContract) {
    return response.notFound({
      code: 404,
      error: 'Model not found error',
      message: error.message,
    } as BasicErrorResponse)
  }
}
