import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdatePCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    name: schema.string.optional({}, [
      rules.unique({ table: 'product_categories', column: 'name' }),
    ]),
    description: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
