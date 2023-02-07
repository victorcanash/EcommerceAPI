import { AuthContract, GuardsList } from '@ioc:Adonis/Addons/Auth'

import { Roles } from 'App/Constants/auth'
import User from 'App/Models/User'
import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import BigbuyService from 'App/Services/BigbuyService'
import { GuestCartItem } from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class UsersService {
  public static async getUserById(id: number, allData: boolean, bigbuyData = false) {
    return this.getUserByField('id', id, allData, bigbuyData)
  }

  public static async getUserByEmail(email: string, allData: boolean, bigbuyData = false) {
    return this.getUserByField('email', email, allData, bigbuyData)
  }

  public static async getAuthEmail(
    auth: AuthContract,
    guard: keyof GuardsList = 'api'
  ): Promise<string> {
    return auth.use(guard).user?.email || ''
  }

  public static async isAuthAdmin(auth: AuthContract) {
    return auth.use('api').user?.role === Roles.ADMIN
  }

  public static async addGuestCart(user: User, items?: GuestCartItem[]) {
    let newUser = user
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const guestCartItem = items[i]
        const cartItem = await CartItem.query()
          .where('cartId', user.cart.id)
          .where('inventoryId', guestCartItem.inventoryId)
          .first()
        if (cartItem) {
          const diffQuantity = guestCartItem.quantity - cartItem.quantity
          if (diffQuantity > 0) {
            cartItem.merge({ quantity: cartItem.quantity + diffQuantity })
            cartItem.save()
          }
        } else {
          const guestCartInventory = await ProductInventory.query()
            .where('id', guestCartItem.inventoryId)
            .first()
          if (guestCartInventory) {
            await CartItem.create({
              inventoryId: guestCartInventory.id,
              quantity: guestCartItem.quantity,
              cartId: user.cart.id,
            })
          }
        }
      }
      newUser = await UsersService.getUserByEmail(user.email, true)
    }
    return newUser
  }

  private static async getUserByField(
    field: string,
    value: string | number,
    allData: boolean,
    bigbuyData = false
  ) {
    let user: User | null = null
    user = await User.query()
      .where(field, value)
      .apply((scopes) => {
        if (allData) {
          scopes.getAllData()
        }
      })
      .first()
    if (!user) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting user`)
    }

    if (bigbuyData && user.cart?.items && user.cart.items.length > 0) {
      let skus = [] as string[]
      user.cart.items.forEach((item) => {
        if (item.inventory) {
          skus.push(item.inventory.sku)
        }
      })
      const stocks = await BigbuyService.getProductsStocks(skus)
      user.cart.items.forEach((item) => {
        if (item.inventory) {
          let stock = stocks.find((stock) => stock.sku === item.inventory.sku)
          item.inventory.bigbuyData.quantity = stock?.quantity || 0
        }
      })
    }

    return user
  }
}
