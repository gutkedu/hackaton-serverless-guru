import { AvailableMomentoCaches } from '@/core/enums/momento-caches.js'
import { MomentoTopicsProvider } from '@/providers/topics/momento-topics.js'
import { GameListenerUseCase } from '../game-listener.js'

export function makeGameListenerUseCase(momentoApiKey: string) {
  const topicsProvider = new MomentoTopicsProvider(momentoApiKey, AvailableMomentoCaches.LOBBY)

  return new GameListenerUseCase(topicsProvider)
}
