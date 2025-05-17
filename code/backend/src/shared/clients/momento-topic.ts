import { TopicConfigurations, CredentialProvider, TopicClient } from '@gomomento/sdk'

let client: TopicClient | null = null

const DEFAULT_CLIENT_TOPIC_TIMEOUT = 5 * 1000 // 5s

interface TopicClientOptions {
  apiKey: string
  timeoutInMs?: number
}

export const momentoTopicClient = ({ apiKey, timeoutInMs }: TopicClientOptions): TopicClient => {
  if (client) {
    return client
  }
  client = new TopicClient({
    configuration: TopicConfigurations.Default.latest().withClientTimeoutMillis(
      timeoutInMs ?? DEFAULT_CLIENT_TOPIC_TIMEOUT
    ),
    credentialProvider: CredentialProvider.fromString(apiKey)
  })
  return client
}
