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

export default class TextsBaseModel extends AppBaseModel {
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
  public static async onFetch(query: ModelQueryBuilderContract<typeof TextsBaseModel>) {
    this.loadDataQuery(query)
  }

  @beforeFind()
  public static async onFind(query: ModelQueryBuilderContract<typeof TextsBaseModel>) {
    this.loadDataQuery(query)
  }

  @afterCreate()
  public static async onCreate(model: TextsBaseModel) {
    await this.loadDataModel(model)
  }

  @afterDelete()
  public static async onDelete(model: TextsBaseModel) {
    await this.deleteDataModel(model)
  }

  private static async loadDataQuery(query: ModelQueryBuilderContract<typeof TextsBaseModel>) {
    query.preload('name').preload('description')
  }

  private static async loadDataModel(model: TextsBaseModel) {
    await model.load('name')
    await model.load('description')
  }

  private static async deleteDataModel(model: TextsBaseModel) {
    await model.name.delete()
    await model.description.delete()
  }
}
