import { AuthContract, GuardsList } from '@ioc:Adonis/Addons/Auth'

import { Roles } from 'App/Models/Enums/Roles'
import User from 'App/Models/User'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'

class UsersService {
  public static async getUserById(id: number, allData: boolean) {
    return this.getUserByField('id', id, allData)
  }

  public static async getUserByEmail(email: string, allData: boolean) {
    return this.getUserByField('email', email, allData)
  }

  public static async getAuthEmail(auth: AuthContract, guard: keyof GuardsList): Promise<string> {
    return auth.use(guard).user?.email || ''
  }

  public static async isAuthAdmin(auth: AuthContract) {
    return auth.use('api').user?.role === Roles.ADMIN
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
    return user
  }
}

export default UsersService
