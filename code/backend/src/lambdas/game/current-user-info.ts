import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import { makeGetCurrentUserInfoUseCase } from '@/use-cases/factories/make-get-current-user-info.js'
import { extractAuthorizerContext } from '@/shared/auth/extract-authorizer.js'
import middy from '@middy/core'

const logger = getLogger()
const getCurrentUserInfoUseCase = makeGetCurrentUserInfoUseCase()

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.appendKeys({
    requestId: context.awsRequestId
  })

  logger.info('Getting current user info', { event })

  try {
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

    const userInfo = await getCurrentUserInfoUseCase.execute({
      username: authorizer.username
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(userInfo)
    }
  } catch (error) {
    return handleApiGwError(error, 'Error getting current user info')
  }
}

export const currentUserInfoHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error getting current user info')
})
