import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_inventories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.string('sku', 255).notNullable()
      table
        .integer('name_id')
        .unsigned()
        .references('id')
        .inTable('localized_texts')
        .onDelete('CASCADE')
      table
        .integer('description_id')
        .unsigned()
        .references('id')
        .inTable('localized_texts')
        .onDelete('CASCADE')
      table.float('price', 255).notNullable()
      table.integer('quantity', 255).defaultTo(0).notNullable()
      table.string('sku', 255).notNullable().unique()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
