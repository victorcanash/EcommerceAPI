import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdatePDiscountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number.optional([rules.exists({ table: 'products', column: 'id' })]),
    name: schema.string.optional(),
    description: schema.string.optional(),
    discountPercent: schema.number.optional(),
    active: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
