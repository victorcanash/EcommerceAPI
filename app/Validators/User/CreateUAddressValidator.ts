import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateUAddressValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    userId: schema.number.optional(),
    addressLine: schema.string(),
    additionalInfo: schema.string(),
    postalCode: schema.string(),
    locality: schema.string(),
    administrativeArea: schema.string(),
    country: schema.string(),
    type: schema.string.optional(),
  })

  public messages: CustomMessages = {}
}
