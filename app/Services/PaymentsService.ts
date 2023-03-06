import Env from '@ioc:Adonis/Core/Env'

import User from 'App/Models/User'
import Cart from 'App/Models/Cart'
import CartsService from 'App/Services/CartsService'
import BraintreeService from 'App/Services/BraintreeService'
import PaypalService from 'App/Services/PaypalService'
import { PaymentModes } from 'App/Constants/payment'
import { GuestUserCheckout } from 'App/Types/user'
import { GuestCartCheck } from 'App/Types/cart'
import PermissionException from 'App/Exceptions/PermissionException'
import BadRequestException from 'App/Exceptions/BadRequestException'

export default class PaymentsService {
  public static async createTransaction(
    user: User | GuestUserCheckout,
    guestCartCheck?: GuestCartCheck,
    paymentMethodNonce?: string,
    remember = false
  ) {
    const result = {
      braintreeTransactionId: undefined as string | undefined,
      paypalOrderId: undefined as string | undefined,
    }

    let cart: Cart | GuestCartCheck | undefined
    if ((user as User)?.id) {
      cart = (user as User).cart
    } else {
      cart = guestCartCheck
    }

    if (!user.shipping) {
      throw new PermissionException(`You don't have an existing shipping address`)
    }
    if (!user.billing) {
      throw new PermissionException(`You don't have an existing billing address`)
    }
    if (!cart) {
      throw new PermissionException(`You don't have an existing cart`)
    }
    if (cart.items && cart.items.length <= 0) {
      throw new PermissionException(`You don't have selected items in your cart`)
    }

    const totalAmount = CartsService.getTotalAmount(cart).amount
    if (totalAmount <= 0) {
      throw new PermissionException(`Your don't have cart amount`)
    }
    const amount = totalAmount.toFixed(2)

    // Braintree Transaction
    const paymentMode = Env.get('PAYMENT_MODE', PaymentModes.BRAINTREE)
    if (paymentMode === PaymentModes.BRAINTREE) {
      if (!paymentMethodNonce) {
        throw new BadRequestException('Missing paymentMethodNonce')
      }

      const braintreeService = new BraintreeService()
      const braintreeCustomer = (user as User)?.id
        ? await braintreeService.getCustomer((user as User).braintreeId)
        : undefined
      if (
        (user as User)?.id &&
        braintreeCustomer &&
        (braintreeCustomer.firstName !== (user as User).firstName ||
          braintreeCustomer.lastName !== (user as User).lastName ||
          braintreeCustomer.email !== user.email)
      ) {
        await braintreeService.updateCustomer(braintreeCustomer.id, user as User)
      }
      const braintreeResult = await braintreeService.createTransaction(
        paymentMethodNonce,
        user,
        amount,
        braintreeCustomer
      )
      if ((user as User)?.id && remember) {
        ;(user as User).merge({
          braintreeId: braintreeResult.transaction.customer.id,
        })
        await (user as User).save()
      } else if ((user as User)?.braintreeId) {
        ;(user as User).merge({
          braintreeId: '',
        })
        await (user as User).save()
      }
      result.braintreeTransactionId = braintreeResult.transaction.id

      // Paypal Transaction
    } else if (paymentMode === PaymentModes.PAYPAL) {
      const { orderProducts } = await PaypalService.createOrderProducts(cart)
      result.paypalOrderId = await PaypalService.createOrder(
        user.email,
        user.shipping,
        orderProducts,
        amount
      )
    }

    return result
  }
}
