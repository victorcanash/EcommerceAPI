import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('category_id')
        .unsigned()
        .references('product_categories.id')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.string('description', 255).notNullable()
      table.string('sku', 255).notNullable()
      table.float('price', 255).notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
