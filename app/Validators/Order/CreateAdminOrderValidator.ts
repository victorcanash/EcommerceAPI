import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { checkoutDataSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateAdminOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    locale: schema.string(),
    checkoutData: checkoutDataSchema,
    cart: guestCartSchema,
    paypalTransactionId: schema.string({}, [
      rules.unique({ table: 'orders', column: 'paypal_transaction_id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
