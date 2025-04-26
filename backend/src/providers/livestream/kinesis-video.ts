/* eslint-disable @typescript-eslint/no-unused-vars */

import { LivestreamProvider } from './livestream-provider'
import { KinesisVideoMediaClient } from '@aws-sdk/client-kinesis-video-media'
import { KinesisVideoClient } from '@aws-sdk/client-kinesis-video'
import { kinesisVideo } from '@/shared/clients/kinesis-video'
import { kinesisVideoMedia } from '@/shared/clients/kinesis-video-media'

export class KinesisVideoProvider implements LivestreamProvider {
  private client: KinesisVideoClient
  private mediaClient: KinesisVideoMediaClient

  constructor() {
    this.client = kinesisVideo()
    this.mediaClient = kinesisVideoMedia()
  }
  async createChannel(channelName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async deleteChannel(channelName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
