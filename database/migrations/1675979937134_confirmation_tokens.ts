import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'confirmation_tokens'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_method_nonce')
      table.json('payment_payload').notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
