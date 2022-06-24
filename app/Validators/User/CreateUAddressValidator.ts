import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateUAddressValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    addressLine: schema.string(),
    additionalInfo: schema.string(),
    postalCode: schema.string(),
    city: schema.string(),
    country: schema.string(),
  })

  public messages: CustomMessages = {}
}
