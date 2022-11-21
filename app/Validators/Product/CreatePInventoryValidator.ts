import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePInventoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    sku: schema.string({}, [rules.unique({ table: 'product_inventories', column: 'sku' })]),
    name: schema.string(),
    description: schema.string(),
    price: schema.number(),
  })

  public messages: CustomMessages = {}
}
