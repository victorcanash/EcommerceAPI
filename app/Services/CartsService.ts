import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import BigbuyService from 'App/Services/BigbuyService'
import { GuestCartCheck, GuestCartCheckItem, GuestCartItem } from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class CartsService {
  public static async getCartById(id: number) {
    return this.getCartByField('id', id)
  }

  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  // Check if there are the quantity desired by user and if there are items with 0 quantity
  public static async checkCartItemsQuantity(cart: Cart | GuestCartCheck) {
    const changedItems: CartItem[] | GuestCartCheckItem[] = []
    for (let i = 0; i < cart.items.length; i++) {
      let item = cart.items[i]
      if (item.quantity > item.inventory.bigbuy.quantity) {
        if ((cart as Cart)?.userId) {
          ;(item as CartItem).merge({ quantity: item.inventory.bigbuy.quantity })
          await (item as CartItem).save()
          changedItems.push(item as CartItem)
        } else {
          ;(item as GuestCartCheckItem).quantity = item.inventory.bigbuy.quantity
          ;(changedItems as GuestCartCheckItem[]).push({
            inventory: (item as GuestCartCheckItem).inventory,
            quantity: item.inventory.bigbuy.quantity,
          })
        }
      }
    }
    return changedItems
  }

  public static async deleteCartItems(cart: Cart) {
    await CartItem.query()
      .where((query) => {
        query.where('cartId', cart.id)
      })
      .delete()
  }

  public static async createGuestCartCheck(items?: GuestCartItem[], bigbuyData = false) {
    let cart: GuestCartCheck = { items: [] }
    if (items && items.length > 0) {
      const inventories = await ProductInventory.query().whereIn(
        'id',
        items.map((item) => {
          return item.inventoryId
        })
      )
      if (inventories.length > 0) {
        if (bigbuyData) {
          const stocks = await BigbuyService.getProductsStocks(
            inventories.map((inventory) => {
              return inventory.sku
            })
          )
          inventories.forEach((inventory) => {
            let stock = stocks.find((stock) => stock.sku === inventory.sku)
            inventory.bigbuyData.quantity = stock?.quantity || 0
          })
        }
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
