import { CacheClient, Configurations, CredentialProvider } from '@gomomento/sdk'

let client: CacheClient | null = null

export const momentoCacheClient = async (apiKey: string, ttlSeconds = 3600): Promise<CacheClient> => {
  if (client) {
    return client
  }
  client = await CacheClient.create({
    defaultTtlSeconds: ttlSeconds,
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString(apiKey)
  })
  return client
}
