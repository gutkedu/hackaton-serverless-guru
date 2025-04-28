export interface SetCacheKeyDTO {
  cacheName: string
  key: string
  data: string
}

export interface GetCacheKeyDTO {
  cacheName: string
  key: string
}
