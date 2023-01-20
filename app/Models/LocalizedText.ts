import { column, computed } from '@ioc:Adonis/Lucid/Orm'
// import HttpContext from '@ioc:Adonis/Core/HttpContext'

import AppBaseModel from 'App/Models/AppBaseModel'

export default class LocalizedText extends AppBaseModel {
  @column()
  public en: string

  @column()
  public es: string

  @computed()
  public get current() {
    /*const ctx = HttpContext.get()
    if (ctx && ctx.i18n.locale === 'es') {
      return this.es
    }
    return this.en*/
    return this.es
  }
}
