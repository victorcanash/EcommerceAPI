import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateCItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    cartId: schema.number.optional(),
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    inventoryId: schema.number([rules.exists({ table: 'product_inventories', column: 'id' })]),
    quantity: schema.number.optional(),
  })

  public messages: CustomMessages = {}
}
