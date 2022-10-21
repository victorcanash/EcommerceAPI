import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SortValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    sortBy: schema.enum.optional([
      'id',
      'firstName',
      'lastName',
      'createdAt',
      'updatedAt',
    ] as const),
    order: schema.enum.optional(['asc', 'desc'] as const),
  })

  public messages: CustomMessages = {}
}
