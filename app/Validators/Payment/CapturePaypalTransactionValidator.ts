import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { checkoutDataSchema, guestCartSchema } from 'App/Validators/shared'

export default class CapturePaypalTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    checkoutData: checkoutDataSchema,
    guestCart: guestCartSchema,
    currency: schema.string(),
  })

  public messages: CustomMessages = {}
}
