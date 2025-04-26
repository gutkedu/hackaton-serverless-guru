import { Item } from './item'
import KSUID from 'ksuid'

export interface StreamerProps {
  id?: string
  createdAt?: string
  updatedAt?: string
}

interface StreamerDynamoKeys {
  pk: `STREAMER`
  sk: `ID#${string}`
}

export interface StreamerDynamo extends StreamerProps, StreamerDynamoKeys {}

export class StreamerEntity extends Item<StreamerProps> {
  get pk(): StreamerDynamoKeys['pk'] {
    return `STREAMER`
  }

  get sk(): StreamerDynamoKeys['sk'] {
    return `ID#${this.props.id}`
  }

  get id(): string {
    return this.props.id as string
  }

  touch() {
    this.props.updatedAt = new Date().toISOString()
  }

  getDynamoKeys(): StreamerDynamoKeys {
    return {
      pk: this.pk,
      sk: this.sk
    }
  }

  toDynamoItem(): StreamerDynamo {
    return {
      ...this.getDynamoKeys(),
      ...this.props
    }
  }

  toProps(): StreamerProps {
    return {
      ...this.props
    }
  }

  static fromDynamoItem(item: StreamerDynamo): StreamerEntity {
    return new StreamerEntity(item)
  }

  static create(props: StreamerProps): StreamerEntity {
    return new StreamerEntity({
      ...props,
      id: props.id ?? KSUID.randomSync().string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}
