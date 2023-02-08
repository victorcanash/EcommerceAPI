import { column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

import AppBaseModel from 'App/Models/AppBaseModel'

export default class GuestUser extends AppBaseModel {
  @column()
  public email: string

  @column()
  public emailVerifiedAt?: DateTime

  @column()
  public rememberMeToken?: string
}
