import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { CustomReporter } from 'App/Validators/Reporters/CustomReporter'

export default class CreateCItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = CustomReporter

  public schema = schema.create({
    inventoryId: schema.number.optional([
      rules.exists({ table: 'product_inventories', column: 'id' }),
    ]),
    packId: schema.number.optional([rules.exists({ table: 'product_packs', column: 'id' })]),
    quantity: schema.number.optional(),
  })

  public messages: CustomMessages = {}
}
