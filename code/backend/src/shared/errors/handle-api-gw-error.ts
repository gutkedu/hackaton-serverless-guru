import { APIGatewayProxyResult } from 'aws-lambda'
import { IntegrationError } from './integration-error.js'
import { z } from 'zod'
import { getLogger } from '../logger/get-logger.js'

const logger = getLogger()

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleApiGwError(error: any, defaultMessage: string, defaultStatusCode = 500): APIGatewayProxyResult {
  logger.error('Error handling API Gateway request', { error })

  // Handle ZodError
  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Parse error',
        details: error.errors
      })
    }
  }

  // Handle Middy ParseError
  if (error.name === 'ParseError') {
    const details = error.message
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Parse error',
        details
      })
    }
  }

  if (error instanceof IntegrationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: error.message
      })
    }
  }

  const statusCode = (error as { statusCode?: number })?.statusCode || defaultStatusCode
  const message = (error as Error)?.message || defaultMessage

  return {
    statusCode,
    headers,
    body: JSON.stringify({
      error: message
    })
  }
}
