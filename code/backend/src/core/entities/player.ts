import { Item } from './item.js'
import KSUID from 'ksuid'

export interface PlayerProps {
  id?: string
  username: string
  email: string
  userConfirmed?: boolean
  currentLobbyId?: string
  gamesPlayed?: number
  wins?: number
  bestWpm?: number
  createdAt?: string
  updatedAt?: string
}

interface PlayerDynamoKeys {
  pk: `PLAYER`
  sk: `USERNAME#${string}`
  gsi1pk: `PLAYER`
  gsi1sk: `EMAIL#${string}`
}

export interface PlayerDynamo extends PlayerProps, PlayerDynamoKeys {}

export class PlayerEntity extends Item<PlayerProps> {
  get pk(): PlayerDynamoKeys['pk'] {
    return `PLAYER`
  }

  get sk(): PlayerDynamoKeys['sk'] {
    return `USERNAME#${this.props.username}`
  }

  get gsi1pk(): PlayerDynamoKeys['gsi1pk'] {
    return `PLAYER`
  }

  get gsi1sk(): PlayerDynamoKeys['gsi1sk'] {
    return `EMAIL#${this.email}`
  }

  get id(): string {
    return this.props.id as string
  }

  get username(): string {
    return this.props.username
  }

  get email(): string {
    return this.props.email
  }

  get userConfirmed(): boolean {
    return this.props.userConfirmed ?? false
  }

  set userConfirmed(userConfirmed: boolean) {
    this.props.userConfirmed = userConfirmed
    this.touch()
  }

  get currentLobbyId(): string | undefined {
    return this.props.currentLobbyId
  }

  get gamesPlayed(): number {
    return this.props.gamesPlayed ?? 0
  }

  get wins(): number {
    return this.props.wins ?? 0
  }

  get bestWpm(): number | undefined {
    return this.props.bestWpm
  }

  setCurrentLobby(lobbyId: string | undefined) {
    this.props.currentLobbyId = lobbyId
    this.touch()
  }

  incrementGamesPlayed(): void {
    this.props.gamesPlayed = (this.props.gamesPlayed ?? 0) + 1
    this.touch()
  }

  incrementWins(): void {
    this.props.wins = (this.props.wins ?? 0) + 1
    this.touch()
  }

  updateBestWpm(wpm: number): boolean {
    if (!this.props.bestWpm || wpm > this.props.bestWpm) {
      this.props.bestWpm = wpm
      this.touch()
      return true
    }
    return false
  }

  touch() {
    this.props.updatedAt = new Date().toISOString()
  }

  getDynamoKeys(): PlayerDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk,
      gsi1pk: this.gsi1pk,
      gsi1sk: this.gsi1sk
    }
  }

  toDynamoItem(): PlayerDynamo {
    const item: PlayerDynamo = {
      ...this.getDynamoKeys(),
      ...this.props
    }

    return item
  }

  toProps(): PlayerProps {
    return {
      ...this.props
    }
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      currentLobbyId: this.currentLobbyId,
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      bestWpm: this.bestWpm,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    }
  }

  static fromDynamoItem(item: PlayerDynamo): PlayerEntity {
    return new PlayerEntity(item)
  }

  static create(props: PlayerProps): PlayerEntity {
    return new PlayerEntity({
      ...props,
      userConfirmed: props.userConfirmed ?? false,
      gamesPlayed: props.gamesPlayed ?? 0,
      wins: props.wins ?? 0,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
