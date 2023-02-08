import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SendOrderEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    locale: schema.string(),
    appName: schema.string(),
    appDomain: schema.string(),
    userEmail: schema.string.optional(),
    userFirstName: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
