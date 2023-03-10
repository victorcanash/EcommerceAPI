import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestUserSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    guestUser: guestUserSchema,
    guestCart: guestCartSchema,
    braintreeTransactionId: schema.string.optional({}, [
      rules.unique({ table: 'orders', column: 'braintree_transaction_id' }),
    ]),
    paypalTransactionId: schema.string.optional({}, [
      rules.unique({ table: 'orders', column: 'paypal_transaction_id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
