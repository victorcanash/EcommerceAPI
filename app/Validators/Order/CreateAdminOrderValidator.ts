import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateAdminOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    locale: schema.string(),
    userId: schema.number.optional([rules.exists({ table: 'users', column: 'id' })]),
    guestUserEmail: schema.string.optional([
      rules.exists({ table: 'guest_users', column: 'email' }),
    ]),
    shipping: addressSchema,
    cart: guestCartSchema,
    braintreeTransactionId: schema.string.optional({}, [
      rules.unique({ table: 'orders', column: 'braintree_transaction_id' }),
    ]),
    paypalTransactionId: schema.string.optional({}, [
      rules.unique({ table: 'orders', column: 'paypal_transaction_id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
