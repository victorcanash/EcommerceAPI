import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestCartSchema } from 'App/Validators/shared'

export default class InitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    categoryIds: schema.array
      .optional()
      .members(schema.number([rules.exists({ table: 'product_categories', column: 'id' })])),
    productIds: schema.array
      .optional()
      .members(schema.number([rules.exists({ table: 'products', column: 'id' })])),
    packIds: schema.array
      .optional()
      .members(schema.number([rules.exists({ table: 'product_packs', column: 'id' })])),
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
