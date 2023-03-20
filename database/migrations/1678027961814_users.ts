import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['email'])
      table.string('paypal_id', 255).defaultTo('')
      table.setNullable('birthday')
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(['email'])
      table.dropColumn('paypal_id')
      table.dropNullable('birthday')
    })
  }
}
