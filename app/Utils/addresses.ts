import { CountryOptions } from 'App/constants/addresses'

export const getCountryCode = (countryName: CountryOptions) => {
  const indexOfS = Object.values(CountryOptions).indexOf(countryName as unknown as CountryOptions)
  const key = Object.keys(CountryOptions)[indexOfS] as keyof typeof CountryOptions
  return key
}

export const getCountryName = (countryCode: string) => {
  const countryName = (CountryOptions[countryCode] as CountryOptions) || ''
  return countryName
}
