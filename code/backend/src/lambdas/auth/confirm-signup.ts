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

const confirmSignupSchema = z.object({
  email: z.string().email(),
  confirmationCode: z.string()
})

type ConfirmSignupSchema = z.infer<typeof confirmSignupSchema>

const handler = async (event: ConfirmSignupSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Confirm signup request received')

    await cognitoProvider.confirmSignUp(event.email, event.confirmationCode)

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

export const confirmSignupHandler = middy(handler)
  .use(
    parser({
      schema: confirmSignupSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
