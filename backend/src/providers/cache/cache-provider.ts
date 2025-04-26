import { GetCacheKeyDTO, SetCacheKeyDTO } from './cache-dto'

export interface CacheProvider {
  createCache(cacheName: string): Promise<void>
  deleteCache(cacheName: string): Promise<void>
  set(payload: SetCacheKeyDTO): Promise<void>
  get(payload: GetCacheKeyDTO): Promise<string | null>
}
