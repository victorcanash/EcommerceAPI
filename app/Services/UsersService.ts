import { AuthContract, GuardsList } from '@ioc:Adonis/Addons/Auth'

import { Roles } from 'App/Constants/Auth'
import User from 'App/Models/User'
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
      for (let i = 0; i < user.cart.items.length; i++) {
        if (user.cart.items[i].inventory) {
          await user.cart.items[i].inventory.loadBigbuyData()
        }
      }
    }
    return user
  }
}
