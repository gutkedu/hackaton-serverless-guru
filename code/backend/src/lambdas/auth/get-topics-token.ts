import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'
import { MomentoTopicsProvider } from '@/providers/topics/momento-topics.js'
import secretsManager from '@middy/secrets-manager'
import { MiddyContext } from '@/shared/middy/middy-context.js'

const logger = getLogger()

const handler = async (event: APIGatewayProxyEvent, context: MiddyContext): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('getting momento token', { event, context })

  const topicsProvider = new MomentoTopicsProvider(
    context.momentoApiKeys.MOMENTO_USER_USER_KEY,
    context.momentoApiKeys.MOMENTO_TOPICS_CACHE_NAME
  )

  const response = await topicsProvider.generateDisposableTopicsAuthToken()

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
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error leaving lobby')
  })
