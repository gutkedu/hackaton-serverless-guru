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

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type SigninSchema = z.infer<typeof signinSchema>

const handler = async ({ email, password }: SigninSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Signin request received')

    const { idToken, accessToken, expiresIn, refreshToken } = await cognitoProvider.signIn(email, password)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        accessToken,
        idToken,
        expiresIn,
        refreshToken
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error during signin')
  }
}

export const signinHandler = middy(handler)
  .use(
    parser({
      schema: signinSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
