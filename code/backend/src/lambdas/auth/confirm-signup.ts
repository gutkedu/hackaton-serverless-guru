import { APIGatewayProxyResult } from 'aws-lambda'
import { getLogger } from '@/shared/logger/get-logger.js'
import { CognitoProvider } from '@/providers/auth/cognito-provider.js'
import { z } from 'zod'
import { handleApiGwError } from '@/shared/errors/handle-api-gw-error.js'
import middy from '@middy/core'
import { parser } from '@aws-lambda-powertools/parser/middleware'
import { ApiGatewayEnvelope } from '@aws-lambda-powertools/parser/envelopes'
import { DynamoPlayerRepository } from '@/repositories/dynamodb/dynamo-player-repository.js'

const cognitoProvider = new CognitoProvider()
const dynamoPlayerRepo = new DynamoPlayerRepository()
const logger = getLogger()

const confirmSignupSchema = z.object({
  email: z.string().email(),
  confirmationCode: z.string()
})

type ConfirmSignupSchema = z.infer<typeof confirmSignupSchema>

const handler = async ({ confirmationCode, email }: ConfirmSignupSchema): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Confirm signup request received')

    const player = await dynamoPlayerRepo.getByEmail(email)
    if (!player) {
      logger.error('Player not found')
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Player not found'
        })
      }
    }

    await cognitoProvider.confirmSignUp(email, confirmationCode)

    player.userConfirmed = true

    await dynamoPlayerRepo.update(player)

    logger.info('User confirmed successfully')

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
