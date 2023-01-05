import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class FilterPCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    ids: schema.array
      .optional()
      .members(schema.number([rules.exists({ table: 'product_categories', column: 'id' })])),
  })

  public messages: CustomMessages = {}
}
