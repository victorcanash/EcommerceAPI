import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_inventories'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['sku'])
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(['sku'])
    })
  }
}
