import BasePolicy from 'App/Policies/BasePolicy'
import User from 'App/Models/User'
import PermissionException from 'App/Exceptions/PermissionException'

export default class UserPolicy extends BasePolicy {
  public async view(user: User, userView: User) {
    if (user.id === userView.id) {
      return true
    }

    throw new PermissionException(
      'You are not this user or you need to be an admin to view this user'
    )
  }

  public async update(user: User, userUpdate: User) {
    if (user.id === userUpdate.id) {
      return true
    }

    throw new PermissionException(
      'You are not this user or you need to be an admin to update this user'
    )
  }

  public async delete(user: User, userDelete: User) {
    if (user.id === userDelete.id) {
      return true
    }

    throw new PermissionException(
      'You are not this user or you need to be an admin to delete this user'
    )
  }
}
