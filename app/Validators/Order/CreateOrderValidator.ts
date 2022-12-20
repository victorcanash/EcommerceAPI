import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema } from 'App/Validators/shared'

export default class CreateOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    locale: schema.string(),
    appName: schema.string(),
    appDomain: schema.string(),
    userId: schema.number([rules.exists({ table: 'users', column: 'id' })]),
    braintreeTransactionId: schema.string({}, [
      rules.unique({ table: 'orders', column: 'braintree_transaction_id' }),
    ]),
    shipping: addressSchema,
    products: schema.array([rules.minLength(1)]).members(
      schema.object().members({
        quantity: schema.number(),
        inventoryId: schema.number([rules.exists({ table: 'product_inventories', column: 'id' })]),
      })
    ),
  })

  public messages: CustomMessages = {}
}
