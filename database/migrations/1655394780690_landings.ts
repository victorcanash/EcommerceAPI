import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'landings'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
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
      table.jsonb('images').defaultTo([])
      table.jsonb('tutorial_sources').defaultTo([])
      table.string('rating', 255).defaultTo('0')
      table.integer('reviews_count', 255).defaultTo(0)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
