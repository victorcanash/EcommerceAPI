import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import CartItem from 'App/Models/CartItem'
import PermissionException from 'App/Exceptions/PermissionException'

export default class CItemPolicy extends BasePolicy {
  public async before(user: User | null, actionName: string) {
    if (actionName !== 'create') {
      return super.before(user, actionName)
    }
  }

  public async view(user: User, cartItem: CartItem) {
    await cartItem.load('cart')
    if (user.id === cartItem.cart.userId) {
      return true
    }

    throw new PermissionException(
      'This item does not belong to your cart or you need to be an admin to view this cart item'
    )
  }

  public async create(user: User) {
    await user.load('cart')
    if (user.cart) {
      return true
    }
    throw new PermissionException(`You don't have have an existing cart to create a new cart item`)
  }

  public async update(user: User, cartItem: CartItem) {
    await cartItem.load('cart')
    if (user.id === cartItem.cart.userId) {
      return true
    }

    throw new PermissionException(
      'This item does not belong to your cart or you need to be an admin to update this cart item'
    )
  }

  public async delete(user: User, cartItem: CartItem) {
    await cartItem.load('cart')
    if (user.id === cartItem.cart.userId) {
      return true
    }

    throw new PermissionException(
      'This item does not belong to your cart or you need to be an admin to delete this cart item'
    )
  }
}
