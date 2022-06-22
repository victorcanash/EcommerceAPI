import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdatePInventoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    productId: schema.number.optional([rules.exists({ table: 'products', column: 'id' })]),
    quantity: schema.number.optional(),
    size: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
