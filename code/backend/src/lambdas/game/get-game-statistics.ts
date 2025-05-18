import { APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeGetGameStatisticsUseCase } from '@/use-cases/factories/make-get-game-statistics.js'
import middy from '@middy/core'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'

const logger = getLogger()
const getGameStatisticsUseCase = makeGetGameStatisticsUseCase()

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('Getting game statistics', { event })

  const result = await getGameStatisticsUseCase.execute()

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  }
}

export const getGameStatisticsHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error getting game statistics')
})
