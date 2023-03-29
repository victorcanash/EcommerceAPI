import BaseSchema from '@ioc:Adonis/Lucid/Schema'

import { Providers } from 'App/Constants/auth'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['email'])
      table.string('paypal_id', 255).defaultTo('')
      table.setNullable('birthday')
      table.enu('auth_provider', Object.values(Providers)).defaultTo(null).nullable()
      table.dropColumn('braintree_id')
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(['email'])
      table.dropColumn('paypal_id')
      table.dropNullable('birthday')
      table.dropColumn('auth_provider')
      table.string('braintree_id', 255).defaultTo('')
    })
  }
}
