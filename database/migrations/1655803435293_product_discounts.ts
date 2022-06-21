import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_discounts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('product_id').unsigned().references('products.id').onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.string('description', 255).notNullable()
      table.integer('discount_percent', 255).notNullable()
      table.boolean('active').defaultTo(true).notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
