import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdateAuthValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    email: schema.string.optional({}, [rules.email(), rules.maxLength(255)]),
    password: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
