export enum GameEventType {
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  GAME_STARTED = 'GAME_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  PLAYER_ACTION = 'PLAYER_ACTION',
  GAME_STATE_UPDATED = 'GAME_STATE_UPDATED'
}

export interface BaseGameEvent {
  type: GameEventType;
  lobbyId: string;
  timestamp: number;
  gameId: string;
}

export interface GameStartedEvent extends BaseGameEvent {
  type: GameEventType.GAME_STARTED;
  content: string;
}

export interface PlayerJoinedEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_JOINED;
  username: string;
}

export interface PlayerLeftEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_LEFT;
  username: string;
}

export interface GameEndedEvent extends BaseGameEvent {
  type: GameEventType.GAME_ENDED;
  winner?: {
    username: string;
  };
  reason?: string;
}

export interface PlayerActionEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_ACTION;
  username: string;
  action: {
    type: string;
    payload: any; // You can make this more specific based on your needs
  };
}

export interface GameStateUpdatedEvent extends BaseGameEvent {
  type: GameEventType.GAME_STATE_UPDATED;
  state: {
    players: Array<{
      username: string;
      score: number;
      progress: number;
    }>;
    gameStatus: 'in_progress' | 'finished';
  };
}

export type GameEvent =
  | GameStartedEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameEndedEvent
  | PlayerActionEvent
  | GameStateUpdatedEvent; 