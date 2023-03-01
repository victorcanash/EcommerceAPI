import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdatePPackValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
    price: schema.number.optional(),
    inventoryIds: schema.array
      .optional([rules.minLength(1)])
      .members(schema.number([rules.exists({ table: 'product_inventories', column: 'id' })])),
  })

  public messages: CustomMessages = {}
}
