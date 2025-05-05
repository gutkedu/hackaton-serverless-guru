import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { ApiGatewayEnvelope } from '@aws-lambda-powertools/parser/envelopes'
import { makeSignUpPlayerUseCase } from '@/use-cases/factories/make-signup-player.js'

const signUpPlayer = makeSignUpPlayerUseCase()
const logger = getLogger()

export const signUpPlayerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z
    .string()
    .nonempty()
    .regex(/^[a-zA-Z0-9]+$/)
})

type SignUpPlayerSchema = z.infer<typeof signUpPlayerSchema>

const handler = async (event: SignUpPlayerSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('signUpPlayer request received', {
      event
    })

    const { email, password, username } = event

    const response = await signUpPlayer.execute({
      email,
      password,
      username
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        response
      })
    }
  } catch (error) {
    return handleApiGwError(error, 'Error during signUpPlayer')
  }
}

export const signUpPlayerHandler = middy(handler)
  .use(
    parser({
      schema: signUpPlayerSchema,
      envelope: ApiGatewayEnvelope
    })
  )
  .onError((request) => {
    const { error } = request
    return handleApiGwError(error, 'Error')
  })
