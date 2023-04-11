import { AuthContract, GuardsList } from '@ioc:Adonis/Addons/Auth'

import { Roles } from 'App/Constants/auth'
import User from 'App/Models/User'
import GuestUser from 'App/Models/GuestUser'
import CartItem from 'App/Models/CartItem'
import ProductInventory from 'App/Models/ProductInventory'
import ProductPack from 'App/Models/ProductPack'
import Order from 'App/Models/Order'
import { GuestCartItem } from 'App/Types/cart'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

export default class UsersService {
  public static async getUserById(id: number, allData: boolean) {
    return this.getUserByField('id', id, allData)
  }

  public static async getUserByEmail(email: string, allData: boolean) {
    return this.getUserByField('email', email, allData)
  }

  public static async getOptionalUserByEmail(email: string, allData: boolean) {
    return this.getOptionalUserByField('email', email, allData)
  }

  public static async getGuestUserById(id: number) {
    return this.getGuestUserByField('id', id)
  }

  public static async getGuestUserByEmail(email: string) {
    return this.getGuestUserByField('email', email)
  }

  public static async getOptionalGuestUserByEmail(email: string) {
    return this.getOptionalGuestUserByField('email', email)
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
        if (guestCartItem.inventoryId) {
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
        } else if (guestCartItem.packId) {
          const cartItem = await CartItem.query()
            .where('cartId', user.cart.id)
            .where('packId', guestCartItem.packId)
            .first()
          if (cartItem) {
            const diffQuantity = guestCartItem.quantity - cartItem.quantity
            if (diffQuantity > 0) {
              cartItem.merge({ quantity: cartItem.quantity + diffQuantity })
              cartItem.save()
            }
          } else {
            const guestCartPack = await ProductPack.query()
              .where('id', guestCartItem.packId)
              .first()
            if (guestCartPack) {
              await CartItem.create({
                packId: guestCartPack.id,
                quantity: guestCartItem.quantity,
                cartId: user.cart.id,
              })
            }
          }
        }
      }
      newUser = await UsersService.getUserByEmail(user.email, true)
    }
    return newUser
  }

  private static async getUserByField(field: string, value: string | number, allData: boolean) {
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
    user.firstOrder = (await Order.findBy('userId', user.id)) || undefined

    return user
  }

  private static async getOptionalUserByField(
    field: string,
    value: string | number,
    allData: boolean
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
    if (user) {
      user.firstOrder = (await Order.findBy('userId', user.id)) || undefined
    }
    return user
  }

  private static async getGuestUserByField(field: string, value: string | number) {
    let guestUser: GuestUser | null = null
    guestUser = await GuestUser.query().where(field, value).first()
    if (!guestUser) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting guest user`)
    }
    return guestUser
  }

  private static async getOptionalGuestUserByField(field: string, value: string | number) {
    let guestUser: GuestUser | null = null
    guestUser = await GuestUser.query().where(field, value).first()
    return guestUser
  }
}
