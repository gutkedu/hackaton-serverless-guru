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

const resetPasswordSchema = z.object({
  email: z.string().email(),
  confirmationCode: z.string(),
  newPassword: z.string().min(8)
})

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

const handler = async (event: ResetPasswordSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Reset password request received')

    await cognitoProvider.confirmForgotPassword(event.email, event.confirmationCode, event.newPassword)

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

export const resetPasswordHandler = middy(handler)
  .use(
    parser({
      schema: resetPasswordSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
