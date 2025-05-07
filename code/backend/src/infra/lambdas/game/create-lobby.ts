import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeCreateLobbyUseCase } from '@/use-cases/factories/make-create-lobby.js'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'
import middy from '@middy/core'

const logger = getLogger()
const createLobbyUseCase = makeCreateLobbyUseCase()

const createLobbyBodySchema = z.object({
  name: z.string().min(3).max(50),
  maxPlayers: z.number().int().min(2).max(10).default(4)
})

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  const { name, maxPlayers } = createLobbyBodySchema.parse(JSON.parse(event.body || '{}'))

  const authorizer = extractAuthorizerContext(event?.requestContext?.authorizer)

  const username = authorizer?.username as string

  logger.info('Creating lobby', { event, authorizer, extractedUsername: username })

  const result = await createLobbyUseCase.execute({
    hostUsername: username,
    maxPlayers,
    name
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      lobby: result.lobby
    })
  }
}

export const createLobbyHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error creating lobby')
})
