import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import Order from 'App/Models/Order'
import PermissionException from 'App/Exceptions/PermissionException'

export default class OrderPolicy extends BasePolicy {
  public async view(user: User, order: Order) {
    if (user.id === order.userId) {
      return true
    }

    throw new PermissionException(
      'This order does not belong to you or you need to be an admin to view this order'
    )
  }
}
