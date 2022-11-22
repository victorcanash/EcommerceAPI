import { CountryOptions } from 'App/Constants/addresses'

export const getCountryCode = (country: CountryOptions) => {
  const indexOfS = Object.values(CountryOptions).indexOf(country as unknown as CountryOptions)
  const key = Object.keys(CountryOptions)[indexOfS]
  return key
}
