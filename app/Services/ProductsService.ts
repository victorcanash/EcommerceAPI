import Drive from '@ioc:Adonis/Core/Drive'

import NP from 'number-precision'

import ProductBaseModel from 'App/Models/ProductBaseModel'
import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ProductPack from 'App/Models/ProductPack'
import LocalizedText from 'App/Models/LocalizedText'
import ProductReview from 'App/Models/ProductReview'
import BigbuyService from 'App/Services/BigbuyService'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import FileNotFoundException from 'App/Exceptions/FileNotFoundException'

export default class ProductsService {
  public static async getProductById(
    id: number,
    allData: boolean,
    adminData = false,
    bigbuyData?: boolean
  ) {
    return this.getProductByField('id', id, allData, adminData, bigbuyData)
  }

  public static async getCategoryById(id: number) {
    return this.getCategoryByField('id', id)
  }

  public static async getCategoryByName(name: string) {
    return this.getCategoryByField('name', name)
  }

  public static async getInventoryById(id: number) {
    return this.getInventoryByField('id', id)
  }

  public static async getDiscountById(id: number) {
    return this.getDiscountByField('id', id)
  }

  public static async getPackById(id: number) {
    return this.getPackByField('id', id)
  }

  public static async getImageById(product: Product, id: number) {
    const productImages = product.imageNames
    if (!productImages || productImages.length <= id) {
      throw new FileNotFoundException(`Invalid image id ${id} getting product image`)
    }

    if (!(await Drive.exists(productImages[id]))) {
      throw new FileNotFoundException(
        `Not found image name ${productImages[id]} in drive disk getting product image`
      )
    }

    return productImages[id]
  }

  public static async createLocalizedTexts(
    name: {
      en: string
      es: string
    },
    description: {
      en: string
      es: string
    }
  ) {
    const nameText = await LocalizedText.create(name)
    const descriptionText = await LocalizedText.create(description)
    return {
      nameId: nameText.id,
      descriptionId: descriptionText.id,
    }
  }

  public static async updateLocalizedTexts(
    productBaseModel: ProductBaseModel,
    name: {
      en: string | undefined
      es: string | undefined
    },
    description: {
      en: string | undefined
      es: string | undefined
    }
  ) {
    productBaseModel.name.merge(name)
    await productBaseModel.name.save()
    productBaseModel.description.merge(description)
    await productBaseModel.description.save()
  }

  public static async calculateInventoryRating(inventory: ProductInventory) {
    return this.calculateRating('inventoryId', inventory)
  }

  public static async calculatePackRating(pack: ProductPack) {
    return this.calculateRating('packId', pack)
  }

  private static async getProductByField(
    field: string,
    value: string | number,
    allData: boolean,
    adminData: boolean,
    bigbuyData?: boolean
  ) {
    let product: Product | null = null
    product = await Product.query()
      .where(field, value)
      .apply((scopes) => {
        if (allData) {
          scopes.getAllData()
        }
        if (adminData) {
          scopes.getAdminData()
        }
      })
      .first()
    if (!product) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product`)
    }

    if (adminData && bigbuyData && product.inventories && product.inventories.length > 0) {
      const stocks = await BigbuyService.getProductsStocks(
        product.inventories.map((item) => {
          return item.sku
        })
      )
      for (let i = 0; i < product.inventories.length; i++) {
        const inventory = product.inventories[i]
        let stock = stocks.find((stock) => stock.sku === inventory.sku)
        // const { id, name, description, price } = await BigbuyService.getProductInfo(inventory.sku)
        inventory.bigbuyData = {
          id: '',
          name: '',
          description: '',
          price: 0,
          quantity: stock?.quantity || 0,
        }
        inventory.merge({ quantity: stock?.quantity || 0 })
        await inventory.save()
      }
    }

    return product
  }

  private static async getCategoryByField(field: string, value: string | number) {
    let category: ProductCategory | null = null
    if (field === 'name' || field === 'description') {
      category = await ProductCategory.query()
        .whereHas(field, (query) => {
          query.where('en', value).orWhere('es', value)
        })
        .first()
    } else {
      category = await ProductCategory.findBy(field, value)
    }
    if (!category) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product category`)
    }
    return category
  }

  private static async getInventoryByField(field: string, value: string | number) {
    let inventory: ProductInventory | null = null
    inventory = await ProductInventory.findBy(field, value)
    if (!inventory) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product inventory`)
    }
    return inventory
  }

  private static async getDiscountByField(field: string, value: string | number) {
    let discount: ProductDiscount | null = null
    discount = await ProductDiscount.findBy(field, value)
    if (!discount) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product discount`)
    }
    return discount
  }

  private static async getPackByField(field: string, value: string | number) {
    let pack: ProductPack | null = null
    pack = await ProductPack.findBy(field, value)
    if (!pack) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product pack`)
    }

    return pack
  }

  private static async calculateRating(findKey: string, item: ProductInventory | ProductPack) {
    const reviews = await ProductReview.query().where(findKey, item.id)
    let total = 0
    let count = 0
    reviews.forEach((review) => {
      total += review.rating
      count++
    })
    const rating = total === 0 && count === 0 ? 0 : NP.round(NP.divide(total, count), 1)
    item.merge({
      rating: rating.toString(),
    })
    item.save()
  }
}
