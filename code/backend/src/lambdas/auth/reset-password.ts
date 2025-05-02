import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

export const resetPasswordHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Reset password request received', { event })

    const schema = z.object({
      email: z.string().email(),
      confirmationCode: z.string(),
      newPassword: z.string().min(8)
    })

    const body = JSON.parse(event.body || '{}')
    const { email, confirmationCode, newPassword } = schema.parse(body)

    await cognitoProvider.confirmForgotPassword(email, confirmationCode, newPassword)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Password reset successful'
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error resetting password')
  }
}
