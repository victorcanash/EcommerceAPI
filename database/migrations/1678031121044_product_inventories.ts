import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_inventories'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['sku'])
      table.string('rating', 255).defaultTo('0')
      table.integer('reviews_count', 255).defaultTo(0)
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(['sku'])
      table.dropColumn('rating')
      table.dropColumn('reviews_count')
    })
  }
}
