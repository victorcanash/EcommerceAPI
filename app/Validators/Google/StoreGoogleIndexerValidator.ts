import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { googleIndexerUrlSchema } from 'App/Validators/shared'

export default class StoreGoogleIndexerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    urls: schema.array([rules.minLength(1)]).members(googleIndexerUrlSchema),
  })

  public messages: CustomMessages = {}
}
