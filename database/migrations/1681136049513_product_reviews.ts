import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_reviews'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id', 255).nullable()
      table.integer('guest_user_id', 255).nullable()
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.integer('rating', 255).notNullable()
      table.string('title', 255).nullable()
      table.text('description', 'longtext').notNullable()
      table.string('email', 255).notNullable()
      table.string('public_name', 255).notNullable()
      table.text('image_url', 'longtext').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
