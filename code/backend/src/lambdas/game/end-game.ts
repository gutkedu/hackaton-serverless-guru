import { APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
import { makeEndGameUseCase } from '@/use-cases/factories/make-end-game.js'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { z } from 'zod'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'

const useCase = makeEndGameUseCase()
const logger = getLogger()

const endGameSchema = z.object({
  lobbyId: z.string().min(1),
  players: z.array(
    z.object({
      username: z.string().min(1),
      wpm: z.number(),
      progress: z.number()
    })
  )
})

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('End Game Lambda - Received request', { event })

  const { lobbyId, players } = endGameSchema.parse(JSON.parse(event.body || '{}'))

  await useCase.execute({
    lobbyId,
    players
  })

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }
}

export const endGameHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error ending game')
})
