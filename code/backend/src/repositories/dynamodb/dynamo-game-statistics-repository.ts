import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { GameStatisticsEntity, GameStatisticsDynamo } from '@/core/entities/game-statistics.js'
import { GameStatisticsRepository } from '../game-statistics-repository.js'
import { dynamo } from '@/shared/clients/dynamo-client.js' // Assuming this client is set up
import { getLogger } from '@/shared/logger/get-logger.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'

const logger = getLogger()

export class DynamoGameStatisticsRepository implements GameStatisticsRepository {
  private client: DynamoDBDocumentClient
  private tableName: string

  constructor() {
    this.client = dynamo()
    if (!process.env.TABLE_NAME) {
      logger.error('TABLE_NAME environment variable is not set for DynamoGameStatisticsRepository')
      throw new Error('TABLE_NAME environment variable is not set')
    }
    this.tableName = process.env.TABLE_NAME
  }

  async get(): Promise<GameStatisticsEntity | null> {
    logger.info('Fetching global game statistics')
    try {
      const response = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            pk: 'STATS',
            sk: 'GLOBAL'
          }
        })
      )

      if (!response.Item) {
        logger.info('No global game statistics found in DB.')
        return null
      }
      logger.info('Global game statistics retrieved successfully', { item: response.Item })
      return GameStatisticsEntity.fromDynamoItem(response.Item as GameStatisticsDynamo)
    } catch (error) {
      logger.error('Error fetching global game statistics', { error })
      throw new IntegrationError('Error fetching game statistics')
    }
  }

  async save(gameStatistics: GameStatisticsEntity): Promise<void> {
    logger.info('Saving global game statistics', { id: gameStatistics.id })
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: gameStatistics.toDynamoItem()
        })
      )
      logger.info('Global game statistics saved successfully', { id: gameStatistics.id })
    } catch (error) {
      logger.error('Error saving global game statistics', { error, id: gameStatistics.id })
      throw new IntegrationError('Error saving game statistics')
    }
  }

  async incrementTotalGamesStarted(amount: number = 1): Promise<number | undefined> {
    logger.info('Atomically incrementing totalGamesStarted', { amount })
    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            pk: 'STATS',
            sk: 'GLOBAL'
          },
          UpdateExpression: 'ADD totalGamesStarted :val SET lastUpdated = :ts',
          ExpressionAttributeValues: {
            ':val': amount,
            ':ts': new Date().toISOString()
          },
          ReturnValues: 'UPDATED_NEW' // Returns the new values of the updated attributes
        })
      )
      logger.info('totalGamesStarted incremented successfully', { newAttributes: result.Attributes })
      return result.Attributes?.totalGamesStarted as number | undefined
    } catch (error) {
      logger.error('Error incrementing totalGamesStarted', { error, amount })
      throw new IntegrationError('Error incrementing totalGamesStarted')
    }
  }

  async incrementTotalGamesFinished(amount: number = 1): Promise<number | undefined> {
    logger.info('Atomically incrementing totalGamesFinished', { amount })
    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            pk: 'STATS',
            sk: 'GLOBAL'
          },
          UpdateExpression: 'ADD totalGamesFinished :val SET lastUpdated = :ts',
          ExpressionAttributeValues: {
            ':val': amount,
            ':ts': new Date().toISOString()
          },
          ReturnValues: 'UPDATED_NEW'
        })
      )
      logger.info('totalGamesFinished incremented successfully', { newAttributes: result.Attributes })
      return result.Attributes?.totalGamesFinished as number | undefined
    } catch (error) {
      logger.error('Error incrementing totalGamesFinished', { error, amount })
      throw new IntegrationError('Error incrementing totalGamesFinished')
    }
  }
}
