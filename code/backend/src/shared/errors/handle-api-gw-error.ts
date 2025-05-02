import { APIGatewayProxyResult } from 'aws-lambda'
import { IntegrationError } from './integration-error'
import { z } from 'zod'
import { getLogger } from '../logger/get-logger'

const logger = getLogger()

export function handleApiGwError(
  error: unknown,
  defaultMessage: string,
  defaultStatusCode = 500
): APIGatewayProxyResult {
  logger.error('Error handling API Gateway request', { error })

  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Validation error',
        details: error.errors
      })
    }
  }

  if (error instanceof IntegrationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message
      })
    }
  }

  const statusCode = (error as { statusCode?: number })?.statusCode || defaultStatusCode
  const message = (error as Error)?.message || defaultMessage

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: message
    })
  }
}
