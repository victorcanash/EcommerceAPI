import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdatePInventoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public refs = schema.refs({
    id: this.ctx.params.id,
  })

  public schema = schema.create({
    productId: schema.number.optional([rules.exists({ table: 'products', column: 'id' })]),
    sku: schema.string.optional({}, [
      rules.unique({ table: 'product_inventories', column: 'sku', whereNot: { id: this.refs.id } }),
    ]),
    name: schema.string.optional(),
    description: schema.string.optional(),
    price: schema.number.optional(),
  })

  public messages: CustomMessages = {}
}
