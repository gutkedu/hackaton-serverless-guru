/* eslint-disable @typescript-eslint/no-unused-vars */

import { LivestreamProvider } from './livestream-provider'
import { KinesisVideoMediaClient } from '@aws-sdk/client-kinesis-video-media'
import { KinesisVideoClient } from '@aws-sdk/client-kinesis-video'
import { kinesisVideo } from '@/shared/clients/kinesis-video'
import { KinesisVideoSignalingClient } from '@aws-sdk/client-kinesis-video-signaling'
import { kinesisVideoSignaling } from '@/shared/clients/kinesis-video-signaling'

export class KinesisVideoProvider implements LivestreamProvider {
  private client: KinesisVideoClient
  private signalingClient: KinesisVideoSignalingClient

  constructor() {
    this.client = kinesisVideo()
    this.signalingClient = kinesisVideoSignaling()
  }
  async createChannel(channelName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async deleteChannel(channelName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
