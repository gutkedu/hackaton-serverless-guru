import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

export const forgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Forgot password request received', { event })

    const schema = z.object({
      email: z.string().email()
    })

    const body = JSON.parse(event.body || '{}')
    const { email } = schema.parse(body)

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
  } catch (error) {
    return handleApiGwError(error, 'Error initiating password reset')
  }
}
