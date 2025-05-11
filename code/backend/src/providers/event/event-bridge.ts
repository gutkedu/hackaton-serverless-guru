import { getLogger } from '@/shared/logger/get-logger.js'
import { EventProvider } from './event-provider.js'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { eventBridge } from '@/shared/clients/event-bridge-client.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { eventSource, EventType } from './events-dto.js'

const logger = getLogger()

export class EventBridgeProvider implements EventProvider {
  private client: EventBridgeClient

  constructor() {
    if (!process.env.EVENT_BUS_NAME) {
      throw new Error('EVENT_BUS_NAME is not set')
    }
    this.client = eventBridge()
  }
  async sendEvent(eventType: EventType, payload: unknown): Promise<void> {
    try {
      await this.client.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: eventSource,
              DetailType: eventType,
              Detail: JSON.stringify(payload),
              EventBusName: process.env.EVENT_BUS_NAME
            }
          ]
        })
      )
      logger.info('Event successfully sent to EventBridge')
    } catch (error) {
      logger.error('Error sending event to EventBridge', {
        error
      })
      throw new IntegrationError('EventBridge Failed to send event')
    }
  }
}
