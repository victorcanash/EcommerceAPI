import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { guestUserWithoutEmailSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreatePaypalTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    guestUser: guestUserWithoutEmailSchema,
    guestCart: guestCartSchema,
    cardName: schema.string.optional(),
    remember: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
