import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { reqLocalizedTextSchema } from 'App/Validators/shared'

export default class CreatePCategoryValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    name: reqLocalizedTextSchema,
    description: reqLocalizedTextSchema,
  })

  public messages: CustomMessages = {}
}
