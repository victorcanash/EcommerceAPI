import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { SortByOptions, OrderOptions } from 'App/Constants/lists'

export default class SortValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    sortBy: schema.enum.optional(Object.values(SortByOptions)),
    order: schema.enum.optional(Object.values(OrderOptions)),
  })

  public messages: CustomMessages = {}
}
