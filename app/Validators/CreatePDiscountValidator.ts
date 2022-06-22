import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePDiscountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    name: schema.string(),
    description: schema.string(),
    discountPercent: schema.number(),
    active: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
