import { Item } from './item'
import KSUID from 'ksuid'

export interface LobbyProps {
  id?: string
  createdAt?: string
  updatedAt?: string
}

interface LobbyDynamoKeys {
  pk: `LOBBY`
  sk: `ID#${string}`
}

export interface LobbyDynamo extends LobbyProps, LobbyDynamoKeys {}

//TODO: add lobby props

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

  touch() {
    this.props.updatedAt = new Date().toISOString()
  }

  getDynamoKeys(): LobbyDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk
    }
  }

  toDynamoItem(): LobbyDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  toProps(): LobbyProps {
    return {
      ...this.props
    }
  }

  static fromDynamoItem(item: LobbyDynamo): LobbyEntity {
    return new LobbyEntity(item)
  }

  static create(props: LobbyProps): LobbyEntity {
    return new LobbyEntity({
      ...props,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
