import KSUID from 'ksuid'
import { Item } from './item.js'

export enum LobbyStatus {
  OPEN = 'OPEN',
  IN_GAME = 'IN_GAME',
  CLOSED = 'CLOSED'
}

export interface LobbyProps {
  id?: string
  name: string
  hostId: string
  maxPlayers: number
  status?: LobbyStatus
  playersUsernames?: string[]
  createdAt?: string
  updatedAt?: string
}

interface LobbyDynamoKeys {
  pk: `LOBBY`
  sk: `ID#${string}`
  gsi1pk?: `LOBBYSTATUS#${LobbyStatus}`
  gsi1sk?: `CREATED#${string}`
}

export interface LobbyDynamo extends LobbyProps, LobbyDynamoKeys {}

export class LobbyEntity extends Item<LobbyProps> {
  get pk(): LobbyDynamoKeys['pk'] {
    return `LOBBY`
  }

  get sk(): LobbyDynamoKeys['sk'] {
    return `ID#${this.props.id}`
  }

  get id(): string {
    return this.props.id as string
  }

  get name(): string {
    return this.props.name
  }

  get hostId(): string {
    return this.props.hostId
  }

  get maxPlayers(): number {
    return this.props.maxPlayers
  }

  get status(): LobbyStatus {
    return this.props.status || LobbyStatus.OPEN
  }

  set status(status: LobbyStatus) {
    this.props.status = status
  }

  get playersUsernames(): string[] {
    return this.props.playersUsernames || []
  }

  get playerCount(): number {
    return this.playersUsernames.length
  }

  isHost(playerId: string): boolean {
    return this.hostId === playerId
  }

  isFull(): boolean {
    return this.playerCount >= this.maxPlayers
  }

  hasPlayer(username: string): boolean {
    return this.playersUsernames.includes(username)
  }

  addPlayer(playerId: string): boolean {
    if (this.isFull() || this.hasPlayer(playerId)) {
      return false
    }

    if (!this.props.playersUsernames) {
      this.props.playersUsernames = []
    }

    this.props.playersUsernames.push(playerId)
    this.touch()
    return true
  }

  removePlayer(username: string): boolean {
    if (!this.hasPlayer(username)) {
      return false
    }

    this.props.playersUsernames = this.props.playersUsernames?.filter((player) => player !== username)

    this.touch()
    return true
  }

  setStatus(status: LobbyStatus): void {
    this.props.status = status
    this.touch()
  }

  touch() {
    this.props.updatedAt = new Date().toISOString()
  }

  getDynamoKeys(): LobbyDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk,
      gsi1pk: `LOBBYSTATUS#${this.status}`,
      gsi1sk: `CREATED#${this.props.createdAt}`
    }
  }

  toDynamoItem(): LobbyDynamo {
    const item: LobbyDynamo = {
      ...this.getDynamoKeys(),
      ...this.props
    }

    return item
  }

  toProps(): LobbyProps {
    return {
      ...this.props
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      status: this.status,
      players: this.playersUsernames,
      playerCount: this.playerCount,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    }
  }

  static fromDynamoItem(item: LobbyDynamo): LobbyEntity {
    return new LobbyEntity(item)
  }

  static create(props: LobbyProps): LobbyEntity {
    return new LobbyEntity({
      ...props,
      id: props.id ?? KSUID.randomSync().string,
      status: props.status || LobbyStatus.OPEN,
      playersUsernames: props.playersUsernames || [props.hostId], // Host is automatically added as a player
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
