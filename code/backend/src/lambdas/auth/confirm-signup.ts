import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

export const confirmSignupHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Confirm signup request received', { event })

    const schema = z.object({
      email: z.string().email(),
      confirmationCode: z.string()
    })

    const body = JSON.parse(event.body || '{}')
    const { email, confirmationCode } = schema.parse(body)

    await cognitoProvider.confirmSignUp(email, confirmationCode)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User confirmed successfully'
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error confirming user')
  }
}
