import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { getLogger } from '@/shared/logger/get-logger'

const logger = getLogger('authorizer')

// Cache for JWTs to avoid recreating the verifier for each request
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null

/**
 * Authorizer function for API Gateway to validate JWTs from Cognito
 */
export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  logger.info('Authorizing request', { eventContext: event.methodArn, requestId: context.awsRequestId })

  try {
    if (!verifier) {
      verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.USER_POOL_ID!,
        tokenUse: 'access',
        clientId: process.env.USER_POOL_CLIENT_ID!
      })
    }

    const token = event.authorizationToken
    if (!token) {
      logger.warn('No token found in request')
      throw new Error('Unauthorized')
    }

    const jwtWithoutBearer = token.replace(/^Bearer\s/, '')

    const claims = await verifier.verify(jwtWithoutBearer)

    logger.info('Token verified successfully', {
      subject: claims.sub,
      tokenUse: claims.token_use,
      scope: claims.scope
    })

    return {
      principalId: claims.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      },
      context: {
        userId: claims.sub,
        email: claims.email as string,
        scope: claims.scope as string
      }
    }
  } catch (err) {
    logger.error('Authorization failed', { error: err })
    throw new Error('Unauthorized')
  }
}
