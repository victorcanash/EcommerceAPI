import {
  column,
  belongsTo,
  BelongsTo,
  beforeFetch,
  beforeFind,
  afterDelete,
  beforeCreate,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'
import Logger from '@ioc:Adonis/Core/Logger'

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
  public static async loadDataOnFetch(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    Logger.error('beforeFetch')
    query.preload('name').preload('description')
  }

  @beforeFind()
  public static async loadDataOnFind(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    Logger.error('beforeFind')
    query.preload('name').preload('description')
  }

  @beforeCreate()
  public static async loadDataOnCreate(model: ProductBaseModel) {
    Logger.error('beforeCreate')
    await model.load('name')
    await model.load('description')
  }

  @afterDelete()
  public static async deleteLocalizedTexts(model: ProductBaseModel) {
    Logger.error(JSON.stringify(model))
    await model.name.delete()
    await model.description.delete()
  }
}
