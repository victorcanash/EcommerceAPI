import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public refs = schema.refs({
    id: this.ctx.params.id,
  })

  public schema = schema.create({
    landingId: schema.number.optional([rules.exists({ table: 'landings', column: 'id' })]),
    categoryId: schema.number.optional([
      rules.exists({ table: 'product_categories', column: 'id' }),
    ]),
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
    metaId: schema.string.optional({}, [
      rules.unique({
        table: 'products',
        column: 'meta_id',
        whereNot: { id: this.refs.id },
      }),
    ]),
  })

  public messages: CustomMessages = {}
}
