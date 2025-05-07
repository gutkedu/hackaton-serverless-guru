import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeListLobbiesUseCase } from '@/use-cases/factories/make-list-lobbies.js'
import { LobbyStatus } from '@/core/entities/lobby.js'
import middy from '@middy/core'

const logger = getLogger()
const listLobbiesUseCase = makeListLobbiesUseCase()

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('Listing lobbies', { event })

  // Get query parameters
  const queryParams = event.queryStringParameters || {}
  const status = queryParams.status as LobbyStatus | undefined
  const limit = queryParams.limit ? parseInt(queryParams.limit) : undefined
  const nextToken = queryParams.nextToken

  const result = await listLobbiesUseCase.execute({
    status,
    limit,
    nextToken
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      lobbies: result.lobbies.map((lobby) => lobby.toJSON()),
      nextToken: result.nextToken
    })
  }
}

export const listLobbiesHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error listing lobbies')
})
