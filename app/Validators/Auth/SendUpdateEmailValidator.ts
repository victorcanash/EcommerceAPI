import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SendUpdateEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    url: schema.string(),
    password: schema.string(),
    newEmail: schema.string.optional({}, [
      rules.email(),
      rules.unique({ table: 'users', column: 'email' }),
      rules.maxLength(255),
    ]),
    revertEmail: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
