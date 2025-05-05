import { Item } from './item.js'
import KSUID from 'ksuid'

export interface PlayerProps {
  id?: string
  username: string
  email: string
  userConfirmed?: boolean
  currentLobbyId?: string
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

  setCurrentLobby(lobbyId: string | undefined) {
    this.props.currentLobbyId = lobbyId
    this.touch()
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
      currentLobbyId: this.currentLobbyId
    }
  }

  static fromDynamoItem(item: PlayerDynamo): PlayerEntity {
    return new PlayerEntity(item)
  }

  static create(props: PlayerProps): PlayerEntity {
    return new PlayerEntity({
      ...props,
      userConfirmed: props.userConfirmed ?? false,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
