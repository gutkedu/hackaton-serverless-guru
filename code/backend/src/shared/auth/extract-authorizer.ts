import { AuthorizerContext } from './session.js'

/**
 * Safely extracts the authorizer context from an API Gateway event
 * @param authorizer The authorizer object from the event.requestContext
 * @returns The typed AuthorizerContext or undefined if not available
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractAuthorizerContext(authorizer?: any): AuthorizerContext | undefined {
  if (!authorizer) {
    return undefined
  }
  return {
    userId: authorizer.userId || authorizer.principalId || undefined,
    email: authorizer.email || undefined,
    username: authorizer.username || undefined
  }
}
