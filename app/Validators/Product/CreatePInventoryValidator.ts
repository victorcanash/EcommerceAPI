import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreatePInventoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    sku: schema.string({}, [rules.unique({ table: 'product_inventories', column: 'sku' })]),
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
    price: schema.number(),
    quantity: schema.number(),
    image: schema.string.optional(),
    metaId: schema.string.optional({}, [
      rules.unique({ table: 'product_inventories', column: 'meta_id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
