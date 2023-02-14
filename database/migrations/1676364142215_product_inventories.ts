import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_inventories'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('quantity', 255).defaultTo(0).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
