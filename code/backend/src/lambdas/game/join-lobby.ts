import { APIGatewayProxyResult, Context, APIGatewayProxyEvent } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeJoinLobbyUseCase } from '@/use-cases/factories/make-join-lobby.js'
import middy from '@middy/core'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'

const logger = getLogger()
const joinLobbyUseCase = makeJoinLobbyUseCase()

const joinLobbySchema = z.object({
  lobbyId: z.string().min(1)
})

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  const { lobbyId } = joinLobbySchema.parse(JSON.parse(event.body || '{}'))

  logger.info('Joining lobby', { event })

  const authorizer = extractAuthorizerContext(event.requestContext.authorizer)

  await joinLobbyUseCase.execute({
    lobbyId,
    username: authorizer?.username as string
  })

  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({})
  }
}

export const joinLobbyHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error joining lobby')
})
