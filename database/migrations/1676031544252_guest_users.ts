import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'guest_users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password', 180).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
