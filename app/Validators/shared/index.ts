import { schema } from '@ioc:Adonis/Core/Validator'

import { CountryOptions } from 'App/Constants/addresses'
import { GoogleIndexerActions } from 'App/Constants/google'

export const reqLocalizedTextSchema = schema.object().members({
  en: schema.string(),
  es: schema.string(),
})

export const optLocalizedTextSchema = schema.object().members({
  en: schema.string.optional(),
  es: schema.string.optional(),
})

export const addressSchema = schema.object().members({
  firstName: schema.string(),
  lastName: schema.string(),
  addressLine1: schema.string(),
  addressLine2: schema.string.optional(),
  postalCode: schema.string(),
  locality: schema.string(),
  country: schema.enum(Object.values(CountryOptions)),
})

export const guestUserSchema = schema.object.optional().members({
  email: schema.string(),
  shipping: addressSchema,
  billing: addressSchema,
})

export const guestCartSchema = schema.object.optional().members({
  items: schema.array.optional().members(
    schema.object().members({
      inventoryId: schema.number.optional(),
      packId: schema.number.optional(),
      quantity: schema.number(),
    })
  ),
})

export const checkoutDataSchema = schema.object().members({
  email: schema.string(),
  shipping: addressSchema,
  billing: addressSchema,
  remember: schema.boolean.optional(),
  notes: schema.string.optional(),
})

export const googleIndexerUrlSchema = schema.object().members({
  value: schema.string(),
  action: schema.enum(Object.values(GoogleIndexerActions)),
})
