import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import UserPayment from 'App/Models/UserPayment'
import PermissionException from 'App/Exceptions/PermissionException'

export default class UPaymentPolicy extends BasePolicy {
  public async view(user: User, userPayment: UserPayment) {
    if (user.id === userPayment.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user payment or you need to be an admin to view this user payment'
    )
  }

  public async update(user: User, userPayment: UserPayment) {
    if (user.id === userPayment.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user payment or you need to be an admin to update this user payment'
    )
  }

  public async delete(user: User, userPayment: UserPayment) {
    if (user.id === userPayment.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user payment or you need to be an admin to delete this user payment'
    )
  }
}
