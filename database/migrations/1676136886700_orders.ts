import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('user_id')
      table.integer('guest_user_id', 255).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
