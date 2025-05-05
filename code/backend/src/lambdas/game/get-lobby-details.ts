import { APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeGetLobbyDetailsUseCase } from '@/use-cases/factories/make-get-lobby-details.js'
import middy from '@middy/core'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway'
import { z } from 'zod'

const logger = getLogger()
const getLobbyDetailsUseCase = makeGetLobbyDetailsUseCase()

const lobbyPathParamsSchema = z.object({
  id: z.string().min(1)
})

const getLobbyDetailsApiGwSchema = APIGatewayProxyEventSchema.extend({
  pathParameters: lobbyPathParamsSchema
})

type GetLobbyDetailsEvent = z.infer<typeof getLobbyDetailsApiGwSchema>

const handler = async (event: GetLobbyDetailsEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  const { id: lobbyId } = event.pathParameters

  logger.info('Getting lobby details', { lobbyId })

  const result = await getLobbyDetailsUseCase.execute({
    lobbyId
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      lobby: result.lobby.toJSON(),
      players: result.players.map((player) => player.toJSON())
    })
  }
}

export const getLobbyDetailsHandler = middy(handler)
  .use(
    parser({
      schema: getLobbyDetailsApiGwSchema
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error getting lobby details')
  })
