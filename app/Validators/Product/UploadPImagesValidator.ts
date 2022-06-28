import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreatePImagesValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    images: schema.array().members(
      schema.file({
        size: '2mb',
        extnames: ['jpg', 'gif', 'png'],
      })
    ),
  })

  public messages: CustomMessages = {}
}
