export enum SortByOptions {
  ID = 'id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum OrderOptions {
  ASC = 'asc',
  DESC = 'desc',
}

export const defaultPage = 1
export const defaultLimit = 10
export const defaultSortBy = SortByOptions.ID
export const defaultOrder = OrderOptions.ASC
