import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import secretsManager from '@middy/secrets-manager'
import { MiddyContext } from '@/shared/middy/middy-context.js'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'
import { GameDifficulty } from '@/core/enums/game-difficulty.js'
import { SECRET_MANAGER_MOMENTO_KEYS } from '@/core/constants/secret-manager-keys.js'
import { AvailableMomentoCaches } from '@/core/enums/momento-caches.js'
import { makeStartGameUseCase } from '@/use-cases/factories/make-start-game.js'

const logger = getLogger()

const startGameBodySchema = z.object({
  lobbyId: z.string().min(1),
  difficulty: z.nativeEnum(GameDifficulty).default(GameDifficulty.MEDIUM)
})

const handler = async (event: APIGatewayProxyEvent, context: MiddyContext): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('Starting game', { event })

  const { lobbyId, difficulty } = startGameBodySchema.parse(JSON.parse(event.body || '{}'))

  const authorizer = extractAuthorizerContext(event.requestContext.authorizer)
  const userId = authorizer?.userId as string

  const startGameUseCase = makeStartGameUseCase(
    context.momentoApiKeys.MOMENTO_USER_USER_KEY,
    AvailableMomentoCaches.LOBBY
  )

  await startGameUseCase.execute({
    lobbyId,
    difficulty,
    userId
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: 'Game started successfully'
    })
  }
}

export const startGameHandler = middy(handler)
  .use(
    secretsManager({
      cacheExpiry: 10 * 60 * 1000,
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
    return handleApiGwError(error, 'Error starting game')
  })
