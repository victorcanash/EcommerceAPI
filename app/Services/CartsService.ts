import CartItem from 'App/Models/CartItem'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

class CartsService {
  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  private static async getCartItemByField(field: string, value: string | number) {
    let cartItem: CartItem | null = null
    cartItem = await CartItem.findBy(field, value)
    if (!cartItem) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting cart item`)
    }
    return cartItem
  }
}

export default CartsService
