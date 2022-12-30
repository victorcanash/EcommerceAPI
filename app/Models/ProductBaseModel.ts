import {
  column,
  belongsTo,
  BelongsTo,
  beforeFetch,
  beforeFind,
  afterDelete,
  afterCreate,
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
  public static async onFetch(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    this.loadDataQuery(query)
  }

  @beforeFind()
  public static async onFind(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    this.loadDataQuery(query)
  }

  @afterCreate()
  public static async onCreate(model: ProductBaseModel) {
    await this.loadDataModel(model)
  }

  @afterDelete()
  public static async onDelete(model: ProductBaseModel) {
    await this.deleteDataModel(model)
  }

  private static async loadDataQuery(query: ModelQueryBuilderContract<typeof ProductBaseModel>) {
    query.preload('name').preload('description')
  }

  private static async loadDataModel(model: ProductBaseModel) {
    await model.load('name')
    await model.load('description')
  }

  private static async deleteDataModel(model: ProductBaseModel) {
    await model.name.delete()
    await model.description.delete()
  }
}
