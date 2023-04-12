import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { checkoutDataSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreatePaypalTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    currency: schema.string(),
    checkoutData: checkoutDataSchema,
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
