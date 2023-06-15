import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_category_groups'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
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
      table.string('slug').notNullable().unique()
      table.string('image').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
