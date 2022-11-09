import { BasePolicy as BouncerBasePolicy } from '@ioc:Adonis/Addons/Bouncer'

import User from 'App/Models/User'
import { Roles } from 'App/Constants/Auth'

export default class BasePolicy extends BouncerBasePolicy {
  public async before(user: User | null, _actionName: string) {
    if (user?.role === Roles.ADMIN) {
      return true
    }
  }
}
