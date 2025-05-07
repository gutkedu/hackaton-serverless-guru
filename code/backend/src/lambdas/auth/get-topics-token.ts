import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import secretsManager from '@middy/secrets-manager'
import { MiddyContext } from '@/shared/middy/middy-context.js'
import { MomentoAuthClientProvider } from '@/providers/momento-auth/momento-auth-client-provider.js'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { z } from 'zod'
import { TopicsContexts } from '@/core/enums/topic-contexts.js'
import { topicContextToCacheMapper } from '@/core/mappers/topic-contexts-to-caches.js'

const logger = getLogger()

const getTopicsTokenSchema = z.object({
  topic: z.nativeEnum(TopicsContexts)
})

type GetTopicsTokenSchema = z.infer<typeof getTopicsTokenSchema>

const handler = async (event: GetTopicsTokenSchema, context: MiddyContext): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('getting momento token', { event, context })

  const cache = topicContextToCacheMapper(event.topic)

  logger.info(`Getting token for cache ${cache}`, { event })

  const momentoAuth = new MomentoAuthClientProvider(context.momentoApiKeys.MOMENTO_USER_USER_KEY)

  const response = await momentoAuth.generateDisposableTopicsAuthToken(cache)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(response)
  }
}

export const getTopicsTokenHandler = middy(handler)
  .use(
    secretsManager({
      cacheExpiry: 10 * 60 * 1000,
      cacheKey: 'momento-api-keys',
      fetchData: {
        momentoApiKeys: 'MOMENTO_API_KEYS'
      },
      awsClientOptions: {
        region: process.env.AWS_REGION
      },
      setToContext: true
    })
  )
  .use(
    parser({
      schema: getTopicsTokenSchema
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error leaving lobby')
  })
