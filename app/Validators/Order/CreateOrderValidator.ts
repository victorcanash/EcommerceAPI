import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    locale: schema.string(),
    appName: schema.string(),
    appDomain: schema.string(),
    userId: schema.number.optional([rules.exists({ table: 'users', column: 'id' })]),
    guestUserEmail: schema.string.optional([
      rules.exists({ table: 'guest_users', column: 'email' }),
    ]),
    braintreeTransactionId: schema.string({}, [
      rules.unique({ table: 'orders', column: 'braintree_transaction_id' }),
    ]),
    shipping: addressSchema,
    products: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
