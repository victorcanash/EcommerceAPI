import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePInventoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number([rules.exists({ table: 'products', column: 'id' })]),
    quantity: schema.number(),
    size: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
