import { CountryOptions } from 'App/Constants/addresses'

export type GuestUser = {
  email: string
  shipping: GuestUserAddress
  billing: GuestUserAddress
}

export type GuestUserAddress = {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  locality: string
  country: CountryOptions
}
