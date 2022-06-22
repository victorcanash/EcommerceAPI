import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    name: schema.string({}, [rules.unique({ table: 'product_categories', column: 'name' })]),
    description: schema.string(),
  })

  public messages: CustomMessages = {}
}
