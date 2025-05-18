import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeReturnToLobbyUseCase } from '@/use-cases/factories/make-return-to-lobby.js'
import middy from '@middy/core'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'

const logger = getLogger()
const returnToLobbyUseCase = makeReturnToLobbyUseCase()

const returnToLobbySchema = z.object({
  lobbyId: z.string().min(1)
})

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  const { lobbyId } = returnToLobbySchema.parse(JSON.parse(event.body || '{}'))

  logger.info('Returning to lobby', { lobbyId })

  const authorizer = extractAuthorizerContext(event.requestContext.authorizer)

  if (!authorizer || !authorizer.username) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Unauthorized - User information not found' })
    }
  }

  const result = await returnToLobbyUseCase.execute({
    lobbyId,
    username: authorizer.username
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  }
}

export const returnToLobbyHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error returning to lobby')
})
