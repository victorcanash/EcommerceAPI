import Order from 'App/Models/Order'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class OrdersService {
  public static async getOrderById(
    id: number,
    itemsData: boolean,
    bigbuyData = false,
    braintreeData = false
  ) {
    return this.getOrderByField('id', id, itemsData, bigbuyData, braintreeData)
  }

  public static async getOrderByBigbuyId(
    bigbuyId: string,
    itemsData: boolean,
    bigbuyData = false,
    braintreeData = false
  ) {
    return this.getOrderByField('bigbuyId', bigbuyId, itemsData, bigbuyData, braintreeData)
  }

  private static async getOrderByField(
    field: string,
    value: string | number,
    itemsData: boolean,
    bigbuyData = false,
    braintreeData = false
  ) {
    let order: Order | null = null
    order = await Order.query().where(field, value).first()
    if (!order) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting order`)
    }
    if (itemsData) {
      await order.loadItemsData()
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
