import { column, computed, afterFetch, beforeSave, afterFind } from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import ProductInventory from 'App/Models/ProductInventory'
import BigbuyService from 'App/Services/BigbuyService'
import BraintreeService from 'App/Services/BraintreeService'
import { GuestCartItem, GuestCartCheckItem } from 'App/Types/cart'
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

  @column()
  public products?: string

  public productsData?: GuestCartItem[]

  @computed()
  public get items() {
    return this.itemsData
  }

  public itemsData: GuestCartCheckItem[] = []

  @computed()
  public get bigbuy() {
    return this.bigbuyData
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
    products: [] as {
      id: string
      reference: string
      quantity: number
      name: string
      internalReference: string
    }[],
  }

  @computed()
  public get braintree() {
    return this.braintreeData
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

  @beforeSave()
  public static async onSave(model: Order) {
    model.products = model.productsData ? JSON.stringify(model.productsData) : undefined
  }

  @afterFetch()
  public static afterFetch(model: Order) {
    model.productsData = model.products
      ? (JSON.parse(model.products) as GuestCartItem[])
      : undefined
  }

  @afterFind()
  public static afterFind(model: Order) {
    model.productsData = model.products
      ? (JSON.parse(model.products) as GuestCartItem[])
      : undefined
  }

  public async loadItemsData() {
    if (this.productsData && this.productsData.length > 0) {
      const inventories = await ProductInventory.query().whereIn(
        'id',
        this.productsData.map((item) => {
          return item.inventoryId || -1
        })
      )
      const packs = await ProductPack.query().whereIn(
        'id',
        this.productsData.map((item) => {
          return item.packId || -1
        })
      )
      for (let i = 0; i < this.productsData.length; i++) {
        const product = this.productsData[i]
        if (product.inventoryId) {
          const inventory = inventories.find((item) => item.id === product.inventoryId)
          if (inventory) {
            this.itemsData.push({
              inventory: inventory,
              quantity: product.quantity,
            })
          }
        } else if (product.packId) {
          const pack = packs.find((item) => item.id === product.packId)
          if (pack) {
            this.itemsData.push({
              pack: pack,
              quantity: product.quantity,
            })
          }
        }
      }
    }
  }

  public async loadBigbuyData() {
    if (!this.bigbuyData.id && this.bigbuyId) {
      const orderInfo = await BigbuyService.getOrderInfo(this.bigbuyId)
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
        products: orderInfo.products,
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
