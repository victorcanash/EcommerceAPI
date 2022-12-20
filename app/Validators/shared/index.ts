import { schema } from '@ioc:Adonis/Core/Validator'

import { CountryOptions } from 'App/Constants/addresses'

export const addressSchema = schema.object().members({
  firstName: schema.string(),
  lastName: schema.string(),
  addressLine1: schema.string(),
  addressLine2: schema.string.optional(),
  postalCode: schema.string(),
  locality: schema.string(),
  country: schema.enum(Object.values(CountryOptions)),
})
