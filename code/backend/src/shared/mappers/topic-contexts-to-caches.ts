import { AvailableMomentoCaches } from '@/core/enums/momento-caches.js'
import { ClientTopicContexts } from '@/core/enums/topic-contexts.js'

export function topicContextToCacheMapper(topic: ClientTopicContexts): AvailableMomentoCaches {
  switch (topic) {
    case ClientTopicContexts.LOBBY:
      return AvailableMomentoCaches.LOBBY
    case ClientTopicContexts.MAIN_CHAT:
      return AvailableMomentoCaches.MAIN_CHAT
    default:
      throw new Error(`Unknown topic context: ${topic}`)
  }
}
