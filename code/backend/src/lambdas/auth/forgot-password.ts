import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { CognitoProvider } from '@/providers/auth/cognito-provider.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { APIGatewayProxyEvent } from '@aws-lambda-powertools/parser/types'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Forgot password request received')

  const { email } = forgotPasswordSchema.parse(JSON.parse(event.body || '{}'))

  await cognitoProvider.forgotPassword(email)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Password reset code sent successfully'
    })
  }
}

export const forgotPasswordHandler = middy(handler).onError((request) => {
  const { error } = request
  return handleApiGwError(error, 'Error')
})
