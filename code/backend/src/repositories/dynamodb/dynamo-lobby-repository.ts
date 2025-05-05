import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  QueryCommandInput
} from '@aws-sdk/lib-dynamodb'
import { LobbyRepository, ListLobbiesOptions, ListLobbiesResult } from '../lobby-repository.js'
import { dynamo } from '@/shared/clients/dynamo-client.js'
import { LobbyDynamo, LobbyEntity, LobbyStatus } from '@/entities/lobby.js'
import { IntegrationError } from '@/shared/errors/integration-error.js'
import { getLogger } from '@/shared/logger/get-logger.js'

const logger = getLogger()

export class DynamoLobbyRepository implements LobbyRepository {
  private client: DynamoDBDocumentClient
  private tableName: string

  constructor() {
    this.client = dynamo()
    if (!process.env.TABLE_NAME) {
      throw new Error('TABLE_NAME environment variable is not set')
    }
    this.tableName = process.env.TABLE_NAME
  }

  async create(lobby: LobbyEntity): Promise<LobbyEntity> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: lobby.toDynamoItem()
        })
      )

      logger.info('Lobby created successfully', {
        lobbyId: lobby.id
      })

      return lobby
    } catch (error) {
      logger.error('Error creating lobby', { error })
      throw new IntegrationError('Error creating lobby')
    }
  }

  async getById(id: string): Promise<LobbyEntity | null> {
    try {
      const response = await this.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            pk: 'LOBBY',
            sk: `ID#${id}`
          }
        })
      )

      if (!response.Item) {
        return null
      }

      return LobbyEntity.fromDynamoItem(response.Item as LobbyDynamo)
    } catch (error) {
      logger.error('Error getting lobby by ID', { error, id })
      throw new IntegrationError('Error getting lobby')
    }
  }

  async update(lobby: LobbyEntity): Promise<LobbyEntity> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: lobby.toDynamoItem()
        })
      )

      logger.info('Lobby updated successfully', {
        lobbyId: lobby.id
      })

      return lobby
    } catch (error) {
      logger.error('Error updating lobby', { error, lobbyId: lobby.id })
      throw new IntegrationError('Error updating lobby')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            pk: 'LOBBY',
            sk: `ID#${id}`
          }
        })
      )

      logger.info('Lobby deleted successfully', { id })
    } catch (error) {
      logger.error('Error deleting lobby', { error, id })
      throw new IntegrationError('Error deleting lobby')
    }
  }

  async listLobbies(options?: ListLobbiesOptions): Promise<ListLobbiesResult> {
    try {
      const status = options?.status || LobbyStatus.OPEN
      const limit = options?.limit || 20

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :status',
        ExpressionAttributeValues: {
          ':status': `LOBBYSTATUS#${status}`
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      }

      // Add pagination token if provided
      if (options?.nextToken) {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(options.nextToken, 'base64').toString())
      }

      const response = await this.client.send(new QueryCommand(params))

      const lobbies = (response.Items || []).map((item) => LobbyEntity.fromDynamoItem(item as LobbyDynamo))

      let nextToken
      if (response.LastEvaluatedKey) {
        nextToken = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
      }

      return {
        lobbies,
        nextToken
      }
    } catch (error) {
      logger.error('Error listing lobbies', { error })
      throw new IntegrationError('Error listing lobbies')
    }
  }
}
