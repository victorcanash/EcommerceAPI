import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdateLandingValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public refs = schema.refs({
    id: this.ctx.params.id,
  })

  public schema = schema.create({
    slug: schema.string.optional({}, [
      rules.unique({ table: 'landings', column: 'slug', whereNot: { id: this.refs.id } }),
    ]),
    images: schema.array.optional().members(schema.string()),
    tutorialSources: schema.array.optional().members(schema.string()),
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
  })

  public messages: CustomMessages = {}
}
