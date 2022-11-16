import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import PermissionException from 'App/Exceptions/PermissionException'

export default class CartPolicy extends BasePolicy {
  public async check(user: User, cart: Cart) {
    if (user.id === cart.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your cart or you need to be an admin to check this cart'
    )
  }
}
