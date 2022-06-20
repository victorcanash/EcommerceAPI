import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SortValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    sort_by: schema.enum.optional(['id', 'firstName', 'lastName', 'createdAt', 'updatedAt']),
    order: schema.enum.optional(['asc', 'desc'] as const),
  })

  public messages: CustomMessages = {}
}
