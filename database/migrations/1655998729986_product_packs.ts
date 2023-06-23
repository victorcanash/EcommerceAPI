import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_packs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('landing_id')
        .unsigned()
        .references('id')
        .inTable('landings')
        .onDelete('RESTRICT')
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
      table.string('image').nullable()
      table.string('meta_id', 255).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
