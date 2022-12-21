import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdatePDiscountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number.optional([rules.exists({ table: 'products', column: 'id' })]),
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
    discountPercent: schema.number.optional(),
    active: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
