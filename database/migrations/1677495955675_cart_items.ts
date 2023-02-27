import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cart_items'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('inventory_id')
      table
        .integer('pack_id')
        .unsigned()
        .references('id')
        .inTable('product_packs')
        .onDelete('CASCADE')
        .nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
