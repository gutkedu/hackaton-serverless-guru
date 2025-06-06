import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let client: DynamoDBDocumentClient | null = null

export const dynamo = (): DynamoDBDocumentClient => {
  if (client) {
    return client
  }

  const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION ?? 'us-east-1'
  })

  client = DynamoDBDocumentClient.from(dynamoClient)

  return client
}
