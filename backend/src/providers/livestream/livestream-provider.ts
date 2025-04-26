export interface LivestreamProvider {
  createChannel(channelName: string): Promise<void>
  deleteChannel(channelName: string): Promise<void>
}
