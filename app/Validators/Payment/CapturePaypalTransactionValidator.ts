import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestUserSchema, guestCartSchema } from 'App/Validators/shared'

export default class CapturePaypalTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    guestUser: guestUserSchema,
    guestCart: guestCartSchema,
    remember: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
