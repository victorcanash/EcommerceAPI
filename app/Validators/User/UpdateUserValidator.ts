import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    firstName: schema.string.optional(),
    lastName: schema.string.optional(),
    birthday: schema.date.optional(),
    getEmails: schema.boolean.optional(),
  })

  public messages: CustomMessages = {}
}
