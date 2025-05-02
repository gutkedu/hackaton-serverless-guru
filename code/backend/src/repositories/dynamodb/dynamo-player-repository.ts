import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { PlayerRepository } from '../player-repository.js'
import { dynamo } from '@/shared/clients/dynamo-client.js'
import { PlayerEntity } from '@/entities/player.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger()

export class DynamoPlayerRepository implements PlayerRepository {
  private client: DynamoDBDocumentClient
  private tableName: string

  constructor() {
    this.client = dynamo()
    if (!process.env.TABLE_NAME) {
      throw new Error('TABLE_NAME environment variable is not set')
    }
    this.tableName = process.env.TABLE_NAME
  }

  async create(player: PlayerEntity): Promise<PlayerEntity> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: player.toDynamoItem()
        })
      )

      logger.info('Player created successfully', {
        player: player.toDynamoItem()
      })

      return player
    } catch (error) {
      logger.error('Error creating player', { error })
      throw new IntegrationError('Error creating player')
    }
  }
}
