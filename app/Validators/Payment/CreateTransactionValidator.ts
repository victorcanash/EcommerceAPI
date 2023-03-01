import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestUserSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    paymentMethodNonce: schema.string(),
    remember: schema.boolean(),
    guestUser: guestUserSchema,
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
