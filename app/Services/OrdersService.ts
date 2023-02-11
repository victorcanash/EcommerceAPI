import Order from 'App/Models/Order'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class OrdersService {
  public static async getOrderById(id: number, bigbuyData = false, braintreeData = false) {
    return this.getOrderByField('id', id, bigbuyData, braintreeData)
  }

  public static async getOrderByBigbuyId(
    bigbuyId: string,
    bigbuyData = false,
    braintreeData = false
  ) {
    return this.getOrderByField('bigbuyId', bigbuyId, bigbuyData, braintreeData)
  }

  private static async getOrderByField(
    field: string,
    value: string | number,
    bigbuyData = false,
    braintreeData = false
  ) {
    let order: Order | null = null
    order = await Order.query().where(field, value).first()
    if (!order) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting order`)
    }
    if (bigbuyData) {
      await order.loadBigbuyData()
    }
    if (braintreeData) {
      await order.loadBraintreeData()
    }
    return order
  }
}
