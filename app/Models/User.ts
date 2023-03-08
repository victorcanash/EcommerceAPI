import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  hasOne,
  HasOne,
  ModelQueryBuilderContract,
  scope,
} from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import { Roles } from 'App/Constants/auth'
import { AddressTypes } from 'App/Constants/addresses'
import AppBaseModel from 'App/Models/AppBaseModel'
import UserAddress from 'App/Models/UserAddress'
import Cart from 'App/Models/Cart'

export default class User extends AppBaseModel {
  @column()
  public email: string

  @column()
  public emailVerifiedAt?: DateTime

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column()
  public isActivated: boolean

  @column({ serializeAs: null })
  public role: Roles

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public birthday: DateTime

  @column()
  public getEmails: boolean

  @column()
  public lockedOut: boolean

  @column()
  public braintreeId: string

  @column()
  public paypalId: string

  @hasOne(() => Cart)
  public cart: HasOne<typeof Cart>

  @hasOne(() => UserAddress, {
    onQuery: (query) => {
      query.where('type', AddressTypes.SHIPPING).orderBy('id', 'desc')
    },
  })
  public shipping: HasOne<typeof UserAddress>

  @hasOne(() => UserAddress, {
    onQuery: (query) => {
      query.where('type', AddressTypes.BILLING).orderBy('id', 'desc')
    },
  })
  public billing: HasOne<typeof UserAddress>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  public static getAllData = scope((query: ModelQueryBuilderContract<typeof User, User>) => {
    query
      .preload('cart', (query) => {
        query.preload('items', (query) => {
          query.preload('inventory')
          query.preload('pack')
        })
      })
      .preload('shipping')
      .preload('billing')
  })
}
