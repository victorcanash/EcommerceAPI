import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    categoryId: schema.number([rules.exists({ table: 'product_categories', column: 'id' })]),
    name: schema.string({}, [rules.unique({ table: 'products', column: 'name' })]),
    description: schema.string(),
    sku: schema.string(),
    price: schema.number(),
  })

  public messages: CustomMessages = {}
}
