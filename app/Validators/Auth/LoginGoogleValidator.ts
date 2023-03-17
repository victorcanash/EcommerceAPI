import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class LoginGoogleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    code: schema.string(),
  })

  public messages: CustomMessages = {}
}
