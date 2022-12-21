import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreatePDiscountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
    discountPercent: schema.number(),
    active: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
