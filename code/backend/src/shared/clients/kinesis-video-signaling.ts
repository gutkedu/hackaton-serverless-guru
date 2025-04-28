import { KinesisVideoSignalingClient } from '@aws-sdk/client-kinesis-video-signaling'

const client: KinesisVideoSignalingClient | null = null

export const kinesisVideoSignaling = (): KinesisVideoSignalingClient => {
  if (client) {
    return client
  }
  const mediaClient = new KinesisVideoSignalingClient({
    region: process.env.AWS_REGION
  })
  return mediaClient
}
