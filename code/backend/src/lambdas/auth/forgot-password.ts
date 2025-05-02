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

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

const handler = async (event: ForgotPasswordSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Forgot password request received')

    await cognitoProvider.forgotPassword(event.email)

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

export const forgotPasswordHandler = middy(handler)
  .use(
    parser({
      schema: forgotPasswordSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
