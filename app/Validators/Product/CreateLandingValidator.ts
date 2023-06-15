import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreateLandingValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    slug: schema.string({}, [rules.unique({ table: 'landings', column: 'slug' })]),
    images: schema.array().members(schema.string()),
    tutorialSources: schema.array().members(schema.string()),
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
  })

  public messages: CustomMessages = {}
}
