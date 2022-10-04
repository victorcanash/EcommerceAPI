import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public refs = schema.refs({
    id: this.ctx.params.id,
  })

  public schema = schema.create({
    categoryId: schema.number.optional([
      rules.exists({ table: 'product_categories', column: 'id' }),
    ]),
    name: schema.string.optional({}, [
      rules.unique({ table: 'products', column: 'name', whereNot: { id: this.refs.id } }),
    ]),
    description: schema.string.optional(),
    sku: schema.string.optional(),
    price: schema.number.optional(),
  })

  public messages: CustomMessages = {}
}
