import { EventBridgeClient } from '@aws-sdk/client-eventbridge'

let client: EventBridgeClient | null = null

export const eventBridge = (): EventBridgeClient => {
  if (client) {
    return client
  }
  client = new EventBridgeClient({
    region: process.env.AWS_REGION
  })
  return client
}
