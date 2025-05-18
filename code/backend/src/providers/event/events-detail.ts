import { GameEventType } from '@/core/events/game-events.js'

export interface GameStartedDetail {
  data: {
    gameId: string
    lobbyId: string
    content: string
    type: string
    timestamp: number
  }
}

export interface GameEndedDetail {
  data: {
    gameId: string
    lobbyId: string
    players: {
      username: string
      wpm: number
      progress?: number
    }[]
    winner?: {
      username: string
      wpm: number
      progress?: number
    }
    type: GameEventType
    timestamp: number
  }
}
