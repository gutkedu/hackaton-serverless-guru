import { ClientTopicContexts } from '../../core/enums/topic-contexts.js'
import { AvailableMomentoCaches } from '../../core/enums/momento-caches.js'

export function topicContextToCacheMapper(topic: ClientTopicContexts): AvailableMomentoCaches {
  switch (topic) {
    case ClientTopicContexts.LOBBY:
      return AvailableMomentoCaches.LOBBY
    default:
      throw new Error(`Unknown topic context: ${topic}`)
  }
}
