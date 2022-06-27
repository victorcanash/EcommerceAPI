import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('address_line', 255).notNullable()
      table.string('additional_info', 255).defaultTo('').notNullable()
      table.string('postal_code', 255).notNullable()
      table.string('locality', 255).notNullable()
      table.string('administrative_area', 255).notNullable()
      table.string('country', 255).notNullable()
      table.string('type', 255).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
