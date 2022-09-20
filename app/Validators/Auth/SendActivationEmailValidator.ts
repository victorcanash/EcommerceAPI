import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SendActivationEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    email: schema.string({}, [rules.email(), rules.maxLength(255)]),
    appName: schema.string(),
    appDomain: schema.string(),
    url: schema.string(),
  })

  public messages: CustomMessages = {}
}
