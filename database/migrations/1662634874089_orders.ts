import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id', 255).nullable()
      table.integer('guest_user_id', 255).nullable()
      table.string('braintree_transaction_id', 255).notNullable()
      table.string('bigbuy_id', 255).nullable()
      table.jsonb('products').defaultTo([])

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
