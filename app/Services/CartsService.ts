import NP from 'number-precision'

import { firstBuyDiscountPercent, vatExtractPercent } from 'App/Constants/payments'
import Cart from 'App/Models/Cart'
import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import User from 'App/Models/User'
import {
  GuestCartCheck,
  GuestCartCheckItem,
  GuestCartItem,
  ItemAmount,
  TotalAmount,
} from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class CartsService {
  public static async getCartById(id: number) {
    return this.getCartByField('id', id)
  }

  public static async getCartItemById(id: number) {
    return this.getCartItemByField('id', id)
  }

  private static getItemAmount(item: CartItem | GuestCartCheckItem) {
    const itemTotal = item.inventory ? item.inventory.serialize().realPrice : item.pack?.price || 0
    const itemVat = -NP.round(NP.minus(NP.divide(itemTotal, vatExtractPercent), itemTotal), 2)
    const itemSubtotal = NP.round(NP.minus(itemTotal, itemVat), 2)
    return {
      itemVat,
      itemSubtotal,
      itemTotal,
    } as ItemAmount
  }

  public static getTotalAmount(cart: Cart | GuestCartCheck, user: User | undefined) {
    const itemsAmount: ItemAmount[] = []
    let subtotal = 0
    let total = 0
    let totalQuantity = 0
    cart.items.forEach((item) => {
      if (item.quantity > 0 && (item.inventory || item.pack)) {
        const { itemVat, itemSubtotal, itemTotal } = this.getItemAmount(item)
        itemsAmount.push({ itemVat, itemSubtotal, itemTotal })
        subtotal = NP.round(NP.plus(subtotal, NP.times(itemSubtotal, item.quantity)), 2)
        total = NP.round(NP.plus(total, NP.times(itemTotal, item.quantity)), 2)
        totalQuantity = NP.round(NP.plus(totalQuantity, item.quantity), 2)
      }
    })
    const totalVat = NP.round(NP.minus(total, subtotal), 2)
    let firstBuyDiscount = 0
    if (user && !user.firstOrder) {
      firstBuyDiscount = NP.round(NP.times(NP.divide(firstBuyDiscountPercent, 100), total), 2)
    }
    total = NP.minus(total, firstBuyDiscount)
    return {
      itemsAmount,
      subtotal,
      totalVat,
      totalDiscount: firstBuyDiscount,
      total,
      totalQuantity,
    } as TotalAmount
  }

  // Check if there are the quantity desired by user and if there are items with 0 quantity
  public static async checkCartItemsQuantity(cart: Cart | GuestCartCheck) {
    const changedItems: CartItem[] | GuestCartCheckItem[] = []
    for (let i = 0; i < cart.items.length; i++) {
      let item = cart.items[i]
      if (item.inventory && item.quantity > item.inventory.quantity) {
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
      } else if (item.pack && item.quantity > item.pack.quantity) {
        if ((cart as Cart)?.userId) {
          ;(item as CartItem).merge({ quantity: item.pack.quantity })
          await (item as CartItem).save()
          changedItems.push(item as CartItem)
        } else {
          ;(item as GuestCartCheckItem).quantity = item.pack.quantity
          ;(changedItems as GuestCartCheckItem[]).push({
            pack: (item as GuestCartCheckItem).pack,
            quantity: item.pack.quantity,
          })
        }
      }
    }
    return changedItems
  }

  public static async onBuyItems(cart: Cart | GuestCartCheck) {
    const cartItemIds: number[] = []
    const inventoryIds: number[] = []
    cart.items.forEach((item: CartItem | GuestCartCheckItem) => {
      if ((item as CartItem)?.id) {
        cartItemIds.push((item as CartItem).id)
      }
      if (item.inventory) {
        inventoryIds.push(item.inventory.id)
      } else if (item.pack) {
        item.pack.inventories.forEach((itemInventory) => {
          inventoryIds.push(itemInventory.id)
        })
      }
    })

    // Delete cart items
    if ((cart as Cart)?.id) {
      await CartsService.deleteItemsByIds(cartItemIds)
    }

    // Update inventory quantity
    const inventories = await ProductInventory.query().whereIn('id', inventoryIds)
    for (let i = 0; i < inventories.length; i++) {
      let buyQuantity = 0
      cart.items.forEach((item) => {
        if (item.inventory?.id === inventories[i].id) {
          buyQuantity += item.quantity
        } else if (item.pack) {
          item.pack.inventories.forEach((itemInventory) => {
            if (itemInventory.id === inventories[i].id) {
              buyQuantity += item.quantity
            }
          })
        }
      })
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
        items
          .filter((item) => {
            return item.inventoryId ? true : false
          })
          .map((item) => {
            return item.inventoryId || -1
          })
      )
      const packs = await ProductPack.query().whereIn(
        'id',
        items
          .filter((item) => {
            return item.packId ? true : false
          })
          .map((item) => {
            return item.packId || -1
          })
      )
      if (inventories.length > 0 || packs.length > 0) {
        const cartItems: GuestCartCheckItem[] = []
        items.forEach((item) => {
          if (item.inventoryId) {
            let inventory = inventories.find((inventory) => inventory.id === item.inventoryId)
            if (inventory) {
              cartItems.push({
                inventory,
                quantity: item.quantity,
              })
            }
          } else if (item.packId) {
            let pack = packs.find((pack) => pack.id === item.packId)
            if (pack) {
              cartItems.push({
                pack,
                quantity: item.quantity,
              })
            }
          }
        })
        cart = {
          items: cartItems,
        }
      }
    }
    return cart
  }

  public static async convertToGuestCartItems(cart: Cart | GuestCartCheck) {
    let items: GuestCartItem[] = []
    cart.items.forEach((item: CartItem | GuestCartCheckItem) => {
      items.push({
        inventoryId: (item as CartItem)?.id
          ? (item as CartItem).inventoryId
          : (item as GuestCartCheckItem).inventory?.id,
        packId: (item as CartItem)?.id
          ? (item as CartItem).packId
          : (item as GuestCartCheckItem).pack?.id,
        quantity: item.quantity,
      })
    })
    return items
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
