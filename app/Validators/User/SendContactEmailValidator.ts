import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SendContactEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    email: schema.string({}, [rules.email(), rules.maxLength(255)]),
    firstName: schema.string(),
    tlf: schema.string.optional(),
    comments: schema.string(),
    appName: schema.string(),
    appDomain: schema.string(),
  })

  public messages: CustomMessages = {}
}
