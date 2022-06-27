import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import PermissionException from 'App/Exceptions/PermissionException'

export default class CartPolicy extends BasePolicy {
  public async view(user: User, cart: Cart) {
    if (user.id === cart.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your cart or you need to be an admin to view this cart'
    )
  }

  public async update(user: User, cart: Cart) {
    if (user.id === cart.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your cart or you need to be an admin to update this cart'
    )
  }

  public async delete(user: User, cart: Cart) {
    if (user.id === cart.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your cart or you need to be an admin to delete this cart'
    )
  }
}
