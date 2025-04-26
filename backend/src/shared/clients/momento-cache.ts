import { CacheClient, Configurations, CredentialProvider } from '@gomomento/sdk'

let client: CacheClient | null = null

export const momentoCacheClient = async (apiKey: string): Promise<CacheClient> => {
  if (client) {
    return client
  }
  client = await CacheClient.create({
    defaultTtlSeconds: 3600,
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString(apiKey)
  })
  return client
}
