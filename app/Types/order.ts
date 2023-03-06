export type BigbuyOrderProduct = {
  reference: string
  quantity: number
  internalReference: string
}

export type PaypalOrderProduct = {
  name: string
  description: string
  category: 'PHYSICAL_GOODS'
  sku: string
  quantity: string
  unit_amount: {
    currency_code: string
    value: string
  }
}
