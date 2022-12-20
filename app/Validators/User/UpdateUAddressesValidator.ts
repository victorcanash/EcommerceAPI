import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'
import { addressSchema } from 'App/Validators/shared'

export default class UpdateUAddressesValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    billing: addressSchema,
    shipping: addressSchema,
  })

  public messages: CustomMessages = {}
}
