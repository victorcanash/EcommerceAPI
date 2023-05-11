import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

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
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
    price: schema.number.optional(),
    quantity: schema.number.optional(),
    image: schema.string.optional(),
    metaId: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
