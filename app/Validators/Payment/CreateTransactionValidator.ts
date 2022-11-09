import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { CountryOptions } from 'App/Constants/Addresses'

export default class CreateTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    paymentMethodNonce: schema.string(),
    billing: schema.object().members({
      firstName: schema.string(),
      lastName: schema.string(),
      addressLine1: schema.string(),
      addressLine2: schema.string.optional(),
      postalCode: schema.string(),
      locality: schema.string(),
      country: schema.enum(Object.values(CountryOptions)),
    }),
    shipping: schema.object().members({
      firstName: schema.string(),
      lastName: schema.string(),
      addressLine1: schema.string(),
      addressLine2: schema.string.optional(),
      postalCode: schema.string(),
      locality: schema.string(),
      country: schema.enum(Object.values(CountryOptions)),
    }),
  })

  public messages: CustomMessages = {}
}
