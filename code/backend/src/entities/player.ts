import { Item } from './item'
import KSUID from 'ksuid'

export interface PlayerProps {
  id?: string
  createdAt?: string
  updatedAt?: string
}

interface PlayerDynamoKeys {
  pk: `PLAYER`
  sk: `ID#${string}`
}

export interface PlayerDynamo extends PlayerProps, PlayerDynamoKeys {}

//TODO: add player props

export class PlayerEntity extends Item<PlayerProps> {
  get pk(): PlayerDynamoKeys['pk'] {
    return `PLAYER`
  }

  get sk(): PlayerDynamoKeys['sk'] {
    return `ID#${this.props.id}`
  }

  get id(): string {
    return this.props.id as string
  }

  touch() {
    this.props.updatedAt = new Date().toISOString()
  }

  getDynamoKeys(): PlayerDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk
    }
  }

  toDynamoItem(): PlayerDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  toProps(): PlayerProps {
    return {
      ...this.props
    }
  }

  static fromDynamoItem(item: PlayerDynamo): PlayerEntity {
    return new PlayerEntity(item)
  }

  static create(props: PlayerProps): PlayerEntity {
    return new PlayerEntity({
      ...props,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
