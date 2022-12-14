import BaseSchema from '@ioc:Adonis/Lucid/Schema'

import { AddressTypes, CountryOptions } from 'App/constants/addresses'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enu('type', Object.values(AddressTypes)).notNullable()
      table.string('first_name', 255).notNullable()
      table.string('last_name', 255).notNullable()
      table.string('address_line1', 255).notNullable()
      table.string('address_line2', 255).nullable()
      table.string('postal_code', 255).notNullable()
      table.string('locality', 255).notNullable()
      table.enu('country', Object.values(CountryOptions)).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
