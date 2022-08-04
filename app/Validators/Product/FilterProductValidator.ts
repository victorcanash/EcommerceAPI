import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class FilterProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    keywords: schema.string.optional(),
    category_name: schema.string.optional([
      rules.exists({ table: 'product_categories', column: 'name' }),
    ]),
    orders_remain: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
