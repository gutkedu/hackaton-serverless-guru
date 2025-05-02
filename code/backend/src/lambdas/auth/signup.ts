import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { CognitoProvider } from '@/providers/auth/cognito-provider.js'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { ApiGatewayEnvelope } from '@aws-lambda-powertools/parser/envelopes'

const cognitoProvider = new CognitoProvider()
const logger = getLogger()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
})

type SignupSchema = z.infer<typeof signupSchema>

const handler = async (event: SignupSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Signup request received')

    const { userConfirmed, userSub } = await cognitoProvider.signUp(event.email, event.password, {
      name: event.name || event.email
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User registration successful',
        userConfirmed,
        userSub
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error during signup')
  }
}

export const signupHandler = middy(handler)
  .use(
    parser({
      schema: signupSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
