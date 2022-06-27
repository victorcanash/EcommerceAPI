import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdateUPaymentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    type: schema.string.optional(),
    provider: schema.string.optional(),
    accountNumber: schema.string.optional(),
    expiry: schema.date.optional({
      format: 'yy-MM',
    }),
  })

  public messages: CustomMessages = {}
}
