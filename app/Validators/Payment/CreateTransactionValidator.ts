import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema, guestCartSchema } from 'App/Validators/shared'

export default class CreateTransactionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    appName: schema.string(),
    appDomain: schema.string(),
    paymentMethodNonce: schema.string(),
    remember: schema.boolean(),
    guestUser: schema.object.optional().members({
      email: schema.string([rules.exists({ table: 'guest_users', column: 'email' })]),
      shipping: addressSchema,
      billing: addressSchema,
    }),
    guestCart: guestCartSchema,
  })

  public messages: CustomMessages = {}
}
