import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CheckoutPaypalOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    currencyCode: schema.string.optional(),
    returnUrl: schema.string(),
    cancelUrl: schema.string(),
  })

  public messages: CustomMessages = {}
}
