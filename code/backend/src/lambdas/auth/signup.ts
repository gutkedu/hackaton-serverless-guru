import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger'
import { z } from 'zod'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

export const signupHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Signup request received', { event })

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional()
    })

    const body = JSON.parse(event.body || '{}')
    const { email, password, name } = schema.parse(body)

    const result = await cognitoProvider.signUp(email, password, {
      name: name || email
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User registration successful',
        userConfirmed: result.userConfirmed,
        userSub: result.userSub
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error during signup')
  }
}
