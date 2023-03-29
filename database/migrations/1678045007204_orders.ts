import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('paypal_transaction_id', 255).nullable()
      table.dropColumn('braintree_transaction_id')
      table.string('notes', 255).defaultTo('')
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('paypal_transaction_id')
      table.string('braintree_transaction_id', 255).notNullable()
      table.dropColumn('notes')
    })
  }
}
