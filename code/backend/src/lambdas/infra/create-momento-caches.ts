import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import secretsManager from '@middy/secrets-manager'
import { MiddyContext } from '@/shared/middy/middy-context.js'
import { MomentoCache } from '@/providers/cache/momento-cache.js'
import { AvailableMomentoCaches } from '@/core/enums/momento-caches.js'
import { SECRET_MANAGER_MOMENTO_KEYS } from '@/core/constants/secret-manager-keys.js'

const logger = getLogger()

const handler = async (event: void, context: MiddyContext): Promise<void> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('getting momento token', { event, context })

  const cacheProvider = new MomentoCache(context.momentoApiKeys.MOMENTO_USER_USER_KEY)

  const allCaches = Object.values(AvailableMomentoCaches).map((cacheName) => {
    return {
      cacheName
    }
  })

  for (const { cacheName } of allCaches) {
    logger.info(`Creating cache ${cacheName}`)
    await cacheProvider.createCache(cacheName)
  }

  logger.info('Finished creating caches')
}

export const createMomentoCaches = middy(handler)
  .use(
    secretsManager({
      cacheExpiry: 10 * 60 * 1000,
      cacheKey: 'momento-api-keys',
      fetchData: {
        momentoApiKeys: SECRET_MANAGER_MOMENTO_KEYS
      },
      awsClientOptions: {
        region: process.env.AWS_REGION
      },
      setToContext: true
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error leaving lobby')
  })
