import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdateAuthValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    password: schema.string(),
    newEmail: schema.string.optional({}, [rules.email(), rules.maxLength(255)]),
    newPassword: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
