import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('products').defaultTo([])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
