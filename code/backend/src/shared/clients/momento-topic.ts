import { Configurations, CredentialProvider, TopicClient } from '@gomomento/sdk'

let client: TopicClient | null = null

export const momentoTopicClient = (apiKey: string): TopicClient => {
  if (client) {
    return client
  }
  client = new TopicClient({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString(apiKey)
  })
  return client
}
