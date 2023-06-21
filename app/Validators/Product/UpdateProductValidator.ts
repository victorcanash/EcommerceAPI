import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { optLocalizedTextSchema } from 'App/Validators/shared'

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    landingId: schema.number.optional([rules.exists({ table: 'landings', column: 'id' })]),
    categoriesIds: schema.array
      .optional([rules.minLength(1)])
      .members(schema.number([rules.exists({ table: 'product_categories', column: 'id' })])),
    name: optLocalizedTextSchema,
    description: optLocalizedTextSchema,
  })

  public messages: CustomMessages = {}
}
