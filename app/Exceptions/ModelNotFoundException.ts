import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import BaseException from 'App/Exceptions/BaseException'

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
export default class ModelNotFoundException extends BaseException {
  public async handle(error: this, ctx: HttpContextContract) {
    error.response = {
      code: 404,
      error: 'Model not found error',
      message: error.message,
    }
    return super.handle(error, ctx)
  }

  public report(error: this, ctx: HttpContextContract) {
    super.report(error, ctx)
  }
}
