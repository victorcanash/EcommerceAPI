import {
  column,
  belongsTo,
  BelongsTo,
  beforeFetch,
  afterDelete,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import AppBaseModel from 'App/Models/AppBaseModel'
import LocalizedText from 'App/Models/LocalizedText'

export default class ProductBaseModel extends AppBaseModel {
  @column()
  public nameId: number

  @column()
  public descriptionId: number

  @belongsTo(() => LocalizedText, {
    foreignKey: 'nameId',
  })
  public name: BelongsTo<typeof LocalizedText>

  @belongsTo(() => LocalizedText, {
    foreignKey: 'descriptionId',
  })
  public description: BelongsTo<typeof LocalizedText>

  @beforeFetch()
  public static async loadData(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    query.preload('name').preload('description')
  }

  @afterDelete()
  public static async deleteLocalizedTexts(model: ProductBaseModel) {
    model.name.delete()
    model.description.delete()
  }
}
