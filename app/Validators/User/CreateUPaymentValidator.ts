import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateUPaymentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    userId: schema.number.optional(),
    type: schema.string(),
    provider: schema.string(),
    accountNumber: schema.string(),
    expiry: schema.date(),
  })

  public messages: CustomMessages = {}
}
