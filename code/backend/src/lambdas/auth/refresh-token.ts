import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { CognitoProvider } from '@/providers/auth/cognito-provider.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { ApiGatewayEnvelope } from '@aws-lambda-powertools/parser/envelopes'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

const refreshTokenSchema = z.object({
  refreshToken: z.string()
})

type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>

const handler = async ({ refreshToken: refreshInput }: RefreshTokenSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Refresh token request received')

    const { accessToken, expiresIn, idToken, refreshToken } = await cognitoProvider.refreshToken(refreshInput)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        accessToken,
        idToken,
        expiresIn,
        refreshToken
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error refreshing token')
  }
}

export const refreshTokenHandler = middy(handler)
  .use(
    parser({
      schema: refreshTokenSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
