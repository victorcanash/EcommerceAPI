import BaseSchema from '@ioc:Adonis/Lucid/Schema'

import { OrderStatus } from 'App/Models/Enums/OrderStatus'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.enu('status', Object.values(OrderStatus)).defaultTo(OrderStatus.UNPAID).notNullable()

      table.string('session_id', 255).notNullable()

      table.timestamp('delivered_date', { useTz: true }).nullable()

      table.string('customer_email', 255).notNullable()
      table.string('customer_phone', 255).notNullable()

      table.integer('amount_discount', 255).notNullable()
      table.integer('amount_shipping', 255).notNullable()
      table.integer('amount_subtotal', 255).notNullable()
      table.integer('amount_total', 255).notNullable()
      table.string('currency', 255).notNullable()

      table.string('shipping_name', 255).notNullable()
      table.string('shipping_city', 255).notNullable()
      table.string('shipping_country', 255).notNullable()
      table.string('shipping_line1', 255).notNullable()
      table.string('shipping_line2', 255).nullable()
      table.string('shipping_postal_code', 255).notNullable()
      table.string('shipping_state', 255).notNullable()

      table.string('payment_type', 255).notNullable()

      table.string('last4digits', 255).nullable()

      table.string('billing_name', 255).notNullable()
      table.string('billing_city', 255).notNullable()
      table.string('billing_country', 255).notNullable()
      table.string('billing_line1', 255).notNullable()
      table.string('billing_line2', 255).nullable()
      table.string('billing_postal_code', 255).notNullable()
      table.string('billing_state', 255).notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
