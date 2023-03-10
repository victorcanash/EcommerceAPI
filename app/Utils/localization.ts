import I18n from '@ioc:Adonis/Addons/I18n'

import BadRequestException from 'App/Exceptions/BadRequestException'

export const getSupportedLocale = (locale: string) => {
  const supportedLocale = I18n.getSupportedLocale(locale)
  if (!supportedLocale) {
    throw new BadRequestException(`Unsupported locale: ${locale}`)
  }
  return supportedLocale
}
