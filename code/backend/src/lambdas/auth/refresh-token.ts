import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

export const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Refresh token request received')

    const schema = z.object({
      refreshToken: z.string()
    })

    const body = JSON.parse(event.body || '{}')
    const { refreshToken } = schema.parse(body)

    const result = await cognitoProvider.refreshToken(refreshToken)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        tokens: result
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error refreshing token')
  }
}
