import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_packs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('rating', 255).defaultTo('0')
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('rating')
    })
  }
}
