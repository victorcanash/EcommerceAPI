import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import BaseException from 'App/Exceptions/BaseException'
import { FieldErrorNode } from 'App/Validators/Reporters/CustomReporter'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new ValidationException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class ValidationException extends BaseException {
  private fields: FieldErrorNode[]

  constructor(message: string, fields: FieldErrorNode[]) {
    super(message)
    this.fields = fields
  }

  public async handle(error: this, ctx: HttpContextContract) {
    error.response = {
      code: 422,
      error: error.message,
      fields: error.fields,
    }
    return super.handle(error, ctx)
  }

  public report(error: this, ctx: HttpContextContract) {
    super.report(error, ctx)
  }
}
