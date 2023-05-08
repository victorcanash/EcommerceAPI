import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class SendOrderEmailValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    locale: schema.string(),
    bigbuyId: schema.string([rules.exists({ table: 'orders', column: 'bigbuy_id' })]),
  })

  public messages: CustomMessages = {}
}
