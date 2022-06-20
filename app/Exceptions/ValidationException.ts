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

  constructor(message: string, _fields: FieldErrorNode[]) {
    super(message)
    this.fields = _fields
  }

  public async handle(error, ctx: HttpContextContract) {
    this.errorResponse = {
      code: 422,
      error: 'Validation error',
      fields: this.fields,
    }
    return super.handle(error, ctx)
  }

  public report() {
    super.report()
  }
}
