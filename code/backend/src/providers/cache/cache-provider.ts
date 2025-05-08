import { GetCacheKeyDTO, SetBatchKeyDTO, SetCacheKeyDTO } from './cache-dto.js'

export interface CacheProvider {
  createCache(cacheName: string): Promise<void>
  deleteCache(cacheName: string): Promise<void>
  set(payload: SetCacheKeyDTO): Promise<void>
  setBatch(payload: SetBatchKeyDTO): Promise<void>
  get(payload: GetCacheKeyDTO): Promise<string | null>
}
