import { AuthContract, GuardsList } from '@ioc:Adonis/Addons/Auth'
import { DateTime } from 'luxon'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'

class UsersService {
  public static async getAuthEmail(auth: AuthContract, guard: keyof GuardsList): Promise<string> {
    return auth.use(guard).user?.email || ''
  }

  public static async getUserByEmail(email: string, allData: boolean) {
    let user: User | null = null
    if (allData) {
      user = await User.query()
        .where('email', email)
        .preload('addresses')
        .preload('payments')
        .preload('cart', (query) => {
          query.preload('items', (query) => {
            query.preload('product', (query) => {
              query.preload('activeDiscount')
            })
            query.preload('inventory')
          })
        })
        .first()
    } else {
      user = await User.query().where('email', email).first()
    }
    return user
  }

  public static async getUserById(id: number, allData: boolean) {
    let user: User | null = null
    if (allData) {
      user = await User.query()
        .where('id', id)
        .preload('addresses')
        .preload('payments')
        .preload('cart', (query) => {
          query.preload('items', (query) => {
            query.preload('product', (query) => {
              query.preload('activeDiscount')
            })
            query.preload('inventory')
          })
        })
        .first()
    } else {
      user = await User.query().where('id', id).first()
    }
    return user
  }

  public static async getUsers(
    sortBy: 'firstName' | 'lastName' | 'id' | 'createdAt' | 'updatedAt',
    order: 'asc' | 'desc',
    page: number,
    limit: number
  ) {
    const users = await User.query().orderBy(sortBy, order).paginate(page, limit)
    return users.toJSON()
  }

  public static async createUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    birthday: DateTime
  }) {
    const user = await User.create(data)
    await Cart.create({ userId: user.id, total: 0 })

    return user
  }
}

export default UsersService
