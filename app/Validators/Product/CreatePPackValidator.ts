import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreatePPackValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    landingId: schema.number([rules.exists({ table: 'landings', column: 'id' })]),
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
    price: schema.number(),
    image: schema.string.optional(),
    inventoriesIds: schema
      .array([rules.minLength(1)])
      .members(schema.number([rules.exists({ table: 'product_inventories', column: 'id' })])),
  })

  public messages: CustomMessages = {}
}
