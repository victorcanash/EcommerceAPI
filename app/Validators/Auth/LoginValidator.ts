import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestCartSchema } from 'App/Validators/shared'

export default class LoginValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    email: schema.string({}, [rules.email(), rules.maxLength(255)]),
    password: schema.string(),
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
