import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getLogger } from '@/shared/logger/get-logger'
import { z } from 'zod'
import { CognitoProvider } from '@/providers/auth/cognito-provider'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error'

const logger = getLogger()
const cognitoProvider = new CognitoProvider()

export const signinHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Signin request received', { event })

    const body = JSON.parse(event.body || '{}')

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })

    const { email, password } = schema.parse(body)

    const { accessToken, expiresIn, idToken, refreshToken } = await cognitoProvider.signIn(email, password)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        accessToken,
        expiresIn,
        idToken,
        refreshToken
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error during signin')
  }
}
