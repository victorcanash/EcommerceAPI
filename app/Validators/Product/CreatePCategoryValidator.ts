import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreatePCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    isCategoryGroup: schema.boolean.optional(),
    slug: schema.string({}, [
      rules.unique({ table: 'product_categories', column: 'slug' }),
      rules.unique({ table: 'product_category_groups', column: 'slug' }),
    ]),
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
    image: schema.string.optional(),
    categoryGroupId: schema.number.optional([
      rules.exists({ table: 'product_category_groups', column: 'id' }),
    ]),
  })

  public messages: CustomMessages = {}
}
