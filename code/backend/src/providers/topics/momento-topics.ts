import { TopicsProvider } from './topics-provider.js'
import { TopicClient, TopicPublishResponse } from '@gomomento/sdk'
import { getLogger } from '@/shared/logger/get-logger.js'
import { momentoTopicClient } from '@/shared/clients/momento-topic.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { BaseGameEvent } from '@/core/events/game-events.js'

const logger = getLogger()

export class MomentoTopicsProvider implements TopicsProvider {
  private apiKey: string
  private topicClient: TopicClient
  private topicsCacheName: string

  constructor(apiKey: string, cacheName: string) {
    this.apiKey = apiKey
    this.topicsCacheName = cacheName
    this.topicClient = momentoTopicClient(this.apiKey)
  }
  async publish(topic: string, message: string): Promise<void> {
    try {
      const result = await this.topicClient.publish(this.topicsCacheName, topic, message)
      switch (result.type) {
        case TopicPublishResponse.Success:
          logger.info('Message published successfully', { topic, message })
          break
        case TopicPublishResponse.Error:
          logger.error('Error publishing message to Momento Topics', { error: result })
          throw new IntegrationError('Error publishing message to Momento Topics')
      }
    } catch (error) {
      logger.error('Error publishing message to Momento Topics', { error })
      throw new IntegrationError('Error publishing message to Momento Topics')
    }
  }

  async subscribe(topic: string): Promise<void> {
    try {
      await this.topicClient.subscribe(this.topicsCacheName, topic, {
        onItem: (data) => {
          logger.info('Received message from Momento Topics', {
            topic,
            message: data.value().toString(),
            tokenId: data.tokenId()
          })

          const event = JSON.parse(data.value().toString()) as BaseGameEvent

          logger.info('Processing game event', {
            event
          })
        }
      })
      logger.info('Subscribed to Momento Topics successfully', { topic })
    } catch (error) {
      logger.error('Error subscribing to Momento Topics', { error })
      throw new IntegrationError('Error subscribing to Momento Topics')
    }
  }
}
