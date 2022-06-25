import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateUAddressValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    addressLine: schema.string.optional(),
    additionalInfo: schema.string.optional(),
    postalCode: schema.string.optional(),
    locality: schema.string.optional(),
    administrativeArea: schema.string.optional(),
    country: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
