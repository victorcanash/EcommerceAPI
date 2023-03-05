import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'guest_users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['email'])
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(['email'])
    })
  }
}
