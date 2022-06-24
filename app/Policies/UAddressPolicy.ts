import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import UserAddress from 'App/Models/UserAddress'
import PermissionException from 'App/Exceptions/PermissionException'

export default class UAddressPolicy extends BasePolicy {
  public async view(user: User, userAddress: UserAddress) {
    if (user.id === userAddress.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user address or you need to be an admin to view this user address'
    )
  }

  public async update(user: User, userAddress: UserAddress) {
    if (user.id === userAddress.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user address or you need to be an admin to update this user address'
    )
  }

  public async delete(user: User, userAddress: UserAddress) {
    if (user.id === userAddress.userId) {
      return true
    }

    throw new PermissionException(
      'This is not your user address or you need to be an admin to delete this user address'
    )
  }
}
