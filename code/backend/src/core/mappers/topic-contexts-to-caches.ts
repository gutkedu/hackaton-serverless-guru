import { TopicsContexts } from '../enums/topic-contexts.js'
import { AvailableMomentoCaches } from '../enums/momento-caches.js'

export function topicContextToCacheMapper(topic: TopicsContexts): AvailableMomentoCaches {
  switch (topic) {
    case TopicsContexts.LOBBY:
      return AvailableMomentoCaches.LOBBY
    default:
      throw new Error(`Unknown topic context: ${topic}`)
  }
}
