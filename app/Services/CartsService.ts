import CartItem from 'App/Models/CartItem'
import User from 'App/Models/User'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import PermissionException from 'App/Exceptions/PermissionException'

export default class CartsService {
  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  // Check if there are the quantity desired by user and if there are items with 0 quantity
  public static async checkItemsQuantity(user: User) {
    if (!user.cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }
    const changedItems: CartItem[] = []
    const deletedItems: CartItem[] = []
    for (let i = 0; i < user.cart.items.length; i++) {
      let item = user.cart.items[i]
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

  private static async getCartItemByField(field: string, value: string | number) {
    let cartItem: CartItem | null = null
    cartItem = await CartItem.findBy(field, value)
    if (!cartItem) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting cart item`)
    }
    return cartItem
  }
}
