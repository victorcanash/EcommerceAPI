import { CountryOptions } from 'App/Constants/addresses'

export type CheckoutData = {
  email: string
  shipping: CheckoutAddress
  billing: CheckoutAddress
  remember?: boolean
  notes?: string
}

export type CheckoutAddress = {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  locality: string
  country: CountryOptions
}
