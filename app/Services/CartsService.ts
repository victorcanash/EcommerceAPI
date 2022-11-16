import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class CartsService {
  public static async getCartById(id: number) {
    return this.getCartByField('id', id)
  }

  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  // Check if there are the quantity desired by user and if there are items with 0 quantity
  public static async checkCartItemsQuantity(cart: Cart) {
    await cart.load('items')
    const changedItems: CartItem[] = []
    const deletedItems: CartItem[] = []
    for (let i = 0; i < cart.items.length; i++) {
      let item = cart.items[i]
      await item.load('inventory')
      await item.load('product')
      await item.product.load('activeDiscount')
      if (item.quantity < 1) {
        await item.delete()
      } else if (item.quantity > item.inventory.quantity) {
        if (item.inventory.quantity > 0) {
          item.merge({ quantity: item.inventory.quantity })
          await item.save()
          changedItems.push(item)
        } else {
          deletedItems.push(item)
          await item.delete()
        }
      }
    }
    return {
      changedItems,
      deletedItems,
    }
  }

  private static async getCartByField(field: string, value: string | number) {
    let cart: Cart | null = null
    cart = await Cart.findBy(field, value)
    if (!cart) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting cart`)
    }
    return cart
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
