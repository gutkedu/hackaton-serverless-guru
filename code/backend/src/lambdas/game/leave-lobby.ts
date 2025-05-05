import { APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeLeaveLobbyUseCase } from '@/use-cases/factories/make-leave-lobby.js'
import middy from '@middy/core'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'

const logger = getLogger()
const leaveLobbyUseCase = makeLeaveLobbyUseCase()

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    logger.appendKeys({
      requestId: context.awsRequestId
    })

    logger.info('Leaving lobby', { event })

    const authorizer = extractAuthorizerContext(event.requestContext.authorizer)

    // Leave the lobby
    const result = await leaveLobbyUseCase.execute({
      username: authorizer?.username as string
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: result.success,
        lobbyDeleted: result.lobbyDeleted || false
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error leaving lobby')
  }
}

export const leaveLobbyHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error leaving lobby')
})
