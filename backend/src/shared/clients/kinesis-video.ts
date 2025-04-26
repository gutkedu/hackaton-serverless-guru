import { KinesisVideoClient } from '@aws-sdk/client-kinesis-video'

const client: KinesisVideoClient | null = null

export const kinesisVideo = (): KinesisVideoClient => {
  if (client) {
    return client
  }
  const mediaClient = new KinesisVideoClient({
    region: process.env.AWS_REGION
  })
  return mediaClient
}
