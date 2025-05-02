import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

let client: CognitoIdentityProviderClient | null = null

export const cognito = (): CognitoIdentityProviderClient => {
  if (client) {
    return client
  }
  client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION
  })
  return client
}
