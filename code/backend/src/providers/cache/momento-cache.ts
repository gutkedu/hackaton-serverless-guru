import { momentoCacheClient } from '@/shared/clients/momento-cache.js'
import { CacheProvider } from './cache-provider.js'
import {
  CreateCacheResponse,
  DeleteCacheResponse,
  CacheSetResponse,
  CacheGetResponse,
  CacheSetBatchResponse
} from '@gomomento/sdk'
import { getLogger } from '@/shared/logger/get-logger.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { SetCacheKeyDTO, GetCacheKeyDTO, SetBatchKeyDTO } from './cache-dto.js'

const logger = getLogger()

export class MomentoCache implements CacheProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async get({ cacheName, key }: GetCacheKeyDTO): Promise<string | null> {
    try {
      const client = await momentoCacheClient(this.apiKey)

      const response = await client.get(cacheName, key)

      switch (response.type) {
        case CacheGetResponse.Hit: {
          logger.info(`Cache '${cacheName}' hit successfully`)
          const cachedString = response.toString()
          const cachedData = JSON.parse(cachedString)
          return cachedData
        }
        case CacheGetResponse.Miss: {
          logger.info(`Cache '${cacheName}' miss`)
          return null
        }
        case CacheGetResponse.Error: {
          logger.error(`Failed to get cache '${cacheName}': ${response.type}`)
          throw new IntegrationError(`Failed to get cache '${cacheName}': ${response.type}`)
        }
      }
    } catch (error) {
      logger.error(`Error getting cache '${cacheName}': ${error}`)
      throw new IntegrationError(`Error getting cache '${cacheName}': ${error}`)
    }
  }

  async createCache(cacheName: string): Promise<void> {
    try {
      const client = await momentoCacheClient(this.apiKey)

      const { type } = await client.createCache(cacheName)

      switch (type) {
        case CreateCacheResponse.AlreadyExists:
          logger.info(`Cache '${cacheName}' already exists`)
          break
        case CreateCacheResponse.Success:
          logger.info(`Cache '${cacheName}' created successfully`)
          break
        case CreateCacheResponse.Error: {
          logger.error(`Failed to create cache '${cacheName}': ${type}`)
          throw new IntegrationError(`Failed to create cache '${cacheName}': ${type}`, { type })
        }
      }
    } catch (error) {
      logger.error(`Error creating cache '${cacheName}': ${error}`)
      throw new IntegrationError(`Error creating cache '${cacheName}': ${error}`)
    }
  }

  async deleteCache(cacheName: string): Promise<void> {
    try {
      const client = await momentoCacheClient(this.apiKey)

      const { type } = await client.deleteCache(cacheName)

      switch (type) {
        case DeleteCacheResponse.Success:
          logger.info(`Cache '${cacheName}' deleted successfully`)
          break
        case DeleteCacheResponse.Error: {
          logger.error(`Failed to delete cache '${cacheName}': ${type}`)
          throw new IntegrationError(`Failed to delete cache '${cacheName}': ${type}`, { type })
        }
      }
    } catch (error) {
      logger.error(`Error deleting cache '${cacheName}': ${error}`)
      throw new IntegrationError(`Error deleting cache '${cacheName}': ${error}`)
    }
  }

  async set({ cacheName, data, key }: SetCacheKeyDTO): Promise<void> {
    try {
      const client = await momentoCacheClient(this.apiKey)

      const { type } = await client.set(cacheName, key, data)

      switch (type) {
        case CacheSetResponse.Success:
          logger.info(`Cache '${cacheName}' set successfully`)
          break
        case CacheSetResponse.Error: {
          logger.error(`Failed to set cache '${cacheName}': ${type}`)
          throw new IntegrationError(`Failed to set cache '${cacheName}': ${type}`, { type })
        }
      }
    } catch (error) {
      logger.error(`Error setting cache '${cacheName}': ${error}`)
      throw new IntegrationError(`Error setting cache '${cacheName}': ${error}`)
    }
  }

  async setBatch({ cacheName, items }: SetBatchKeyDTO): Promise<void> {
    try {
      const expirationInSeconds = 24 * 60 * 60 // 24 hours

      const client = await momentoCacheClient(this.apiKey, expirationInSeconds)

      const formattedItems = items.map(({ key, data }) => ({ key, value: data }))

      const response = await client.setBatch(cacheName, formattedItems)

      switch (response.type) {
        case CacheSetBatchResponse.Success:
          logger.info(`Batch set for cache '${cacheName}' completed successfully`)
          break
        case CacheSetBatchResponse.Error:
          logger.error(`Failed to set batch for cache '${cacheName}': ${response.toString()}`)
          throw new IntegrationError(`Failed to set batch for cache '${cacheName}'`, {
            error: response.toString()
          })
      }
    } catch (error) {
      logger.error(`Error setting batch for cache '${cacheName}': ${error}`)
      throw new IntegrationError(`Error setting batch for cache '${cacheName}': ${error}`)
    }
  }
}
