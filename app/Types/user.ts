import { CountryOptions } from 'App/Constants/addresses'

export type GuestUserCheckout = {
  email: string
  shipping: GuestUserCheckoutAddress
  billing: GuestUserCheckoutAddress
}

export type GuestUserCheckoutAddress = {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  locality: string
  country: CountryOptions
}
