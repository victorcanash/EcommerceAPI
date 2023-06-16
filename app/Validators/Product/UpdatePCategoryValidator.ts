import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdatePCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public refs = schema.refs({
    id: this.ctx.params.id,
  })

  public schema = schema.create({
    slug: schema.string.optional({}, [
      rules.unique({ table: 'product_categories', column: 'slug', whereNot: { id: this.refs.id } }),
      rules.unique({
        table: 'product_category_groups',
        column: 'slug',
        whereNot: { id: this.refs.id },
      }),
    ]),
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
    image: schema.string.optional(),
    categoryGroupId: schema.number.optional([
      rules.exists({ table: 'product_category_groups', column: 'id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
