import { column, computed } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import BigbuyService from 'App/Services/BigbuyService'
import BraintreeService from 'App/Services/BraintreeService'
import { GetOrderProduct } from 'App/Types/order'
import { getCountryName } from 'App/Utils/addresses'

export default class Order extends AppBaseModel {
  @column()
  public userId?: number

  @column()
  public guestUserId?: number

  @column()
  public braintreeTransactionId: string

  @column()
  public bigbuyId?: string

  @computed()
  public get bigbuy() {
    return this.bigbuyData
  }

  @computed()
  public get braintree() {
    return this.braintreeData
  }

  public bigbuyData = {
    id: 0,
    status: '',
    shipping: {
      firstName: '',
      lastName: '',
      country: '',
      postalCode: '',
      locality: '',
      addressLine1: '',
      addressLine2: '',
      phone: '',
    },
    products: [] as GetOrderProduct[],
  }

  public braintreeData = {
    amount: '',
    billing: {
      firstName: '',
      lastName: '',
      country: '',
      postalCode: '',
      locality: '',
      addressLine1: '',
      addressLine2: '',
    },
    creditCard: {
      cardType: '',
      last4: '',
    },
    paypalAccount: {
      payerEmail: '',
    },
  }

  public async loadBigbuyData() {
    if (this.bigbuyData.id <= 0 && this.bigbuyId) {
      const orderInfo = await BigbuyService.getOrderInfo(this.bigbuyId)
      const products = [] as GetOrderProduct[]
      for (let i = 0; i < orderInfo.products.length; i++) {
        const item = orderInfo.products[i]
        const inventory = await ProductInventory.findBy('sku', item.reference)
        await inventory?.load('product')
        await inventory?.product?.load('activeDiscount')
        products.push({
          id: item.id,
          reference: item.reference,
          quantity: item.quantity,
          name: item.name,
          inventory: inventory,
        })
      }
      this.bigbuyData = {
        id: orderInfo.id,
        status: orderInfo.status,
        shipping: {
          firstName: orderInfo.shippingAddress.firstName,
          lastName: orderInfo.shippingAddress.lastName,
          country: getCountryName(orderInfo.shippingAddress.country),
          postalCode: orderInfo.shippingAddress.postcode,
          locality: orderInfo.shippingAddress.town,
          addressLine1: orderInfo.shippingAddress.address,
          addressLine2: '',
          phone: orderInfo.shippingAddress.phone,
        },
        products: products,
      }
    }
  }

  public async loadBraintreeData() {
    if (this.braintreeData.amount === '') {
      const braintreeService = new BraintreeService()
      const transactionInfo = await braintreeService.getTransactionInfo(this.braintreeTransactionId)
      this.braintreeData = {
        amount: transactionInfo?.amount || '',
        billing: {
          firstName: transactionInfo?.billing?.firstName || '',
          lastName: transactionInfo?.billing?.lastName || '',
          country: transactionInfo?.billing?.countryName || '',
          postalCode: transactionInfo?.billing?.postalCode || '',
          locality: transactionInfo?.billing?.locality || '',
          addressLine1: transactionInfo?.billing?.streetAddress || '',
          addressLine2: transactionInfo?.billing?.extendedAddress || '',
        },
        creditCard: {
          cardType: transactionInfo?.creditCard?.cardType || '',
          last4: transactionInfo?.creditCard?.last4 || '',
        },
        paypalAccount: {
          payerEmail: transactionInfo?.paypalAccount?.payerEmail || '',
        },
      }
    }
  }
}
