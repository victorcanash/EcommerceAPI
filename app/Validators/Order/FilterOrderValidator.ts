import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class FilterOrderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    userId: schema.number.optional([rules.exists({ table: 'users', column: 'id' })]),
    bigbuyId: schema.string.optional([rules.exists({ table: 'orders', column: 'bigbuy_id' })]),
    guestUserEmail: schema.string.optional([
      rules.exists({ table: 'guest_users', column: 'email' }),
    ]),
  })

  public messages: CustomMessages = {}
}
