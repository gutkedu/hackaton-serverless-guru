import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { PlayerRepository } from '../player-repository.js'
import { dynamo } from '@/shared/clients/dynamo-client.js'
import { PlayerDynamo, PlayerEntity } from '@/entities/player.js'
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
  async getByEmail(email: string): Promise<PlayerEntity | null> {
    try {
      const response = await this.client.send(
        new QueryCommand({
          IndexName: 'gsi1',
          TableName: this.tableName,
          KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk)',
          ExpressionAttributeValues: {
            ':gsi1pk': 'PLAYER',
            ':gsi1sk': `EMAIL#${email}`
          },
          Limit: 1
        })
      )

      if (!response.Items || response.Items.length === 0) {
        return null
      }

      const player = response.Items[0] as PlayerDynamo

      return PlayerEntity.fromDynamoItem(player)
    } catch (error) {
      logger.error('Error getting player by email', { error, email })
      throw new IntegrationError('Error getting player by email')
    }
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
        playerId: player.id
      })

      return player
    } catch (error) {
      logger.error('Error creating player', { error })
      throw new IntegrationError('Error creating player')
    }
  }

  async update(player: PlayerEntity): Promise<PlayerEntity> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: player.toDynamoItem()
        })
      )

      logger.info('Player updated successfully', {
        playerId: player.id
      })

      return player
    } catch (error) {
      logger.error('Error updating player', { error })
      throw new IntegrationError('Error updating player')
    }
  }

  async getByUsername(username: string): Promise<PlayerEntity | null> {
    try {
      const response = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            pk: 'PLAYER',
            sk: `USERNAME#${username}`
          }
        })
      )

      if (!response.Item) {
        return null
      }

      return PlayerEntity.fromDynamoItem(response.Item as PlayerDynamo)
    } catch (error) {
      logger.error('Error getting player by username', { error, username })
      throw new IntegrationError('Error getting player')
    }
  }

  async getPlayersInLobby(lobbyId: string): Promise<PlayerEntity[]> {
    try {
      // In a real implementation, we would need a GSI to efficiently query this
      // For now, we'll just scan and filter, but this isn't efficient for production
      const response = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'pk = :pk',
          FilterExpression: 'currentLobbyId = :lobbyId',
          ExpressionAttributeValues: {
            ':pk': 'PLAYER',
            ':lobbyId': lobbyId
          }
        })
      )

      return (response.Items || []).map((item) => PlayerEntity.fromDynamoItem(item as PlayerDynamo))
    } catch (error) {
      logger.error('Error getting players in lobby', { error, lobbyId })
      throw new IntegrationError('Error getting players in lobby')
    }
  }
}
