import BaseSchema from '@ioc:Adonis/Lucid/Schema'

import { Providers, Roles } from 'App/Constants/auth'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('email', 255).notNullable().unique()
      table.date('email_verified_at').nullable()
      table.string('password', 255).notNullable()
      table.string('remember_me_token', 255).nullable()
      table.boolean('is_activated').defaultTo(false).notNullable()
      table.enu('role', Object.values(Roles)).defaultTo(Roles.USER).notNullable()
      table.enu('auth_provider', Object.values(Providers)).defaultTo(null).nullable()
      table.string('first_name', 255).notNullable()
      table.string('last_name', 255).notNullable()
      table.date('birthday').nullable()
      table.boolean('get_emails').notNullable()
      table.boolean('locked_out').defaultTo(false).notNullable()
      table.string('paypal_id', 255).defaultTo('')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
