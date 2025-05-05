import { LobbyEntity, LobbyStatus } from '@/entities/lobby.js'

export interface ListLobbiesOptions {
  status?: LobbyStatus
  limit?: number
  nextToken?: string
}

export interface ListLobbiesResult {
  lobbies: LobbyEntity[]
  nextToken?: string
}

export interface LobbyRepository {
  create(lobby: LobbyEntity): Promise<LobbyEntity>
  getById(id: string): Promise<LobbyEntity | null>
  update(lobby: LobbyEntity): Promise<LobbyEntity>
  delete(id: string): Promise<void>
  listLobbies(options?: ListLobbiesOptions): Promise<ListLobbiesResult>
}
