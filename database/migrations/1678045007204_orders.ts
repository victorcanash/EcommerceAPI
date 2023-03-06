import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('braintree_transaction_id')
      table.string('paypal_transaction_id', 255).nullable()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropNullable('braintree_transaction_id')
      table.dropColumn('paypal_transaction_id')
    })
  }
}
