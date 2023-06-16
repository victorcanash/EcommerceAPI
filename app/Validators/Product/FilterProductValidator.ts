import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class FilterProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    keywords: schema.string.optional(),
    adminData: schema.boolean.optional(),
    bigbuyData: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
