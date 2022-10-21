import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class RefundPaypalOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    paypalOrderId: schema.string(),
    amount: schema.number(),
    currencyCode: schema.string.optional(),
    noteToPlayer: schema.string(),
  })

  public messages: CustomMessages = {}
}
