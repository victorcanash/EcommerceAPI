import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema, guestCartSchema } from 'App/Validators/shared'

export default class SendConfirmTransactionEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    url: schema.string(),
    paymentMethodNonce: schema.string(),
    guestUser: schema.object().members({
      email: schema.string(),
      shipping: addressSchema,
      billing: addressSchema,
    }),
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
