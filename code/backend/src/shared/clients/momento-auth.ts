import { AuthClient, CredentialProvider } from '@gomomento/sdk'

let client: AuthClient | null = null

export const momentoAuthClient = (apiKey: string): AuthClient => {
  if (client) {
    return client
  }
  client = new AuthClient({ credentialProvider: CredentialProvider.fromString(apiKey) })
  return client
}
