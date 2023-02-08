import ProductInventory from 'App/Models/ProductInventory'

export type SendOrderProduct = {
  reference: string
  quantity: number
  internalReference: string
}

export type GetOrderProduct = {
  id: string
  reference: string
  quantity: number
  name: string
  inventory: ProductInventory | null
}
