import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import { GuestCartCheck, GuestCartCheckItem, GuestCartItem } from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class CartsService {
  public static async getCartById(id: number) {
    return this.getCartByField('id', id)
  }

  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  public static getTotalAmount(cart: Cart | GuestCartCheck) {
    let amount = 0
    let quantity = 0
    cart.items.forEach((item) => {
      const inventory = item.inventory.serialize()
      amount += inventory.realPrice * item.quantity
      quantity += item.quantity
    })
    return {
      amount,
      quantity,
    }
  }

  // Check if there are the quantity desired by user and if there are items with 0 quantity
  public static async checkCartItemsQuantity(cart: Cart | GuestCartCheck) {
    const changedItems: CartItem[] | GuestCartCheckItem[] = []
    for (let i = 0; i < cart.items.length; i++) {
      let item = cart.items[i]
      if (item.quantity > item.inventory.quantity) {
        if ((cart as Cart)?.userId) {
          ;(item as CartItem).merge({ quantity: item.inventory.quantity })
          await (item as CartItem).save()
          changedItems.push(item as CartItem)
        } else {
          ;(item as GuestCartCheckItem).quantity = item.inventory.quantity
          ;(changedItems as GuestCartCheckItem[]).push({
            inventory: (item as GuestCartCheckItem).inventory,
            quantity: item.inventory.quantity,
          })
        }
      }
    }
    return changedItems
  }

  public static async onBuyItems(cart: Cart | GuestCartCheck) {
    const inventories = await ProductInventory.query().whereIn(
      'id',
      cart.items.map((item: CartItem | GuestCartCheckItem) => {
        return item.inventory.id
      })
    )
    for (let i = 0; i < inventories.length; i++) {
      const buyQuantity =
        cart.items.find(
          (item: CartItem | GuestCartCheckItem) => inventories[i].id === item.inventory.id
        )?.quantity || 0
      inventories[i].merge({ quantity: inventories[i].quantity - buyQuantity })
      await inventories[i].save()
    }
  }

  public static async deleteItemsByCart(cart: Cart) {
    await CartItem.query()
      .where((query) => {
        query.where('cartId', cart.id)
      })
      .delete()
  }

  public static async deleteItemsByIds(ids: number[]) {
    await CartItem.query().whereIn('id', ids).delete()
  }

  public static async createGuestCartCheck(items?: GuestCartItem[]) {
    let cart: GuestCartCheck = { items: [] }
    if (items && items.length > 0) {
      const inventories = await ProductInventory.query().whereIn(
        'id',
        items.map((item) => {
          return item.inventoryId
        })
      )
      if (inventories.length > 0) {
        const cartItems: GuestCartCheckItem[] = []
        items.forEach((item) => {
          let inventory = inventories.find((inventory) => inventory.id === item.inventoryId)
          if (inventory) {
            cartItems.push({
              inventory,
              quantity: item.quantity,
            })
          }
        })
        cart = {
          items: cartItems,
        }
      }
    }
    return cart
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
