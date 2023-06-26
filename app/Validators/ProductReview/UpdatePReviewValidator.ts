import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class UpdatePReviewValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    rating: schema.number.optional([rules.range(0, 5)]),
    title: schema.string.optional(),
    description: schema.string.optional(),
    publicName: schema.string.optional(),
    imageUrl: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
