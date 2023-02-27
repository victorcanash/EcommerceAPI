import { column, computed } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import BigbuyService from 'App/Services/BigbuyService'
import BraintreeService from 'App/Services/BraintreeService'
import { GuestCartCheckItem } from 'App/Types/cart'
import { getCountryName } from 'App/Utils/addresses'
import ProductPack from './ProductPack'

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
    id: '',
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
    products: [] as GuestCartCheckItem[],
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
    if (!this.bigbuyData.id && this.bigbuyId) {
      const orderInfo = await BigbuyService.getOrderInfo(this.bigbuyId)
      const products: GuestCartCheckItem[] = []
      for (let i = 0; i < orderInfo.products.length; i++) {
        const item = orderInfo.products[i]
        const packId = item.internalReference.substring(0, item.internalReference.indexOf('-'))
        const pack = (await ProductPack.findBy('id', parseInt(packId))) || undefined
        let inventory: ProductInventory | undefined
        if (pack) {
          products.push({
            pack: pack,
            quantity: item.quantity,
          })
        } else {
          inventory = (await ProductInventory.findBy('sku', item.reference)) || undefined
          products.push({
            inventory: inventory,
            quantity: item.quantity,
          })
        }
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
