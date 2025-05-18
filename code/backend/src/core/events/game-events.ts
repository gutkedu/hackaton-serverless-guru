export enum GameEventType {
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  GAME_STARTED = 'GAME_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  PLAYER_ACTION = 'PLAYER_ACTION',
  GAME_STATE_UPDATED = 'GAME_STATE_UPDATED'
}

export interface BaseGameEvent {
  type: GameEventType
  lobbyId: string
  timestamp: number
  gameId: string
}

export interface PlayerJoinedEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_JOINED
  username: string
}

export interface PlayerLeftEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_LEFT
  username: string
}

export interface GameStartedEvent extends BaseGameEvent {
  type: GameEventType.GAME_STARTED
  content: string
}

export interface PlayerResult {
  username: string
  wpm: number
  progress?: number
}

export interface GameEndedEvent extends BaseGameEvent {
  type: GameEventType.GAME_ENDED
  players: PlayerResult[]
  winner?: PlayerResult
  reason?: string
}

export type GameEvent = PlayerJoinedEvent | PlayerLeftEvent | GameStartedEvent | GameEndedEvent
