import Drive from '@ioc:Adonis/Core/Drive'

import Product from 'App/Models/Product'
import ProductCategory from 'App/Models/ProductCategory'
import ProductInventory from 'App/Models/ProductInventory'
import ProductDiscount from 'App/Models/ProductDiscount'
import ModelNotFoundException from 'App/Exceptions/ModelNotFoundException'
import FileNotFoundException from 'App/Exceptions/FileNotFoundException'

export default class ProductsService {
  public static async getProductById(
    id: number,
    allData: boolean,
    adminData = false,
    bigbuyData = false
  ) {
    return this.getProductByField('id', id, allData, adminData, bigbuyData)
  }

  public static async getCategoryById(id: number) {
    return this.getCategoryByField('id', id)
  }

  public static async getCategoryByName(name: string) {
    return this.getCategoryByField('name', name)
  }

  public static async getInventoryById(id: number, bigbuyData = false) {
    return this.getInventoryByField('id', id, bigbuyData)
  }

  public static async getDiscountById(id: number) {
    return this.getDiscountByField('id', id)
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

  private static async getProductByField(
    field: string,
    value: string | number,
    allData: boolean,
    adminData: boolean,
    bigbuyData = false
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
    if (bigbuyData && product.inventories && product.inventories.length > 0) {
      for (let i = 0; i < product.inventories.length; i++) {
        await product.inventories[i].loadBigbuyData()
      }
    }
    return product
  }

  private static async getCategoryByField(field: string, value: string | number) {
    let category: ProductCategory | null = null
    category = await ProductCategory.findBy(field, value)
    if (!category) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product category`)
    }
    return category
  }

  private static async getInventoryByField(
    field: string,
    value: string | number,
    bigbuyData = false
  ) {
    let inventory: ProductInventory | null = null
    inventory = await ProductInventory.findBy(field, value)
    if (!inventory) {
      throw new ModelNotFoundException(`Invalid ${field} ${value} getting product inventory`)
    }
    if (bigbuyData) {
      inventory.loadBigbuyData()
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
}
