import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cart_items'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('inventory_id')
        .unsigned()
        .references('id')
        .inTable('product_inventories')
        .onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
