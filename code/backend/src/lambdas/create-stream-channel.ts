import { APIGatewayProxyHandler } from 'aws-lambda'

import { getLogger } from '@/shared/logger/get-logger'
import { kinesisVideo } from '@/shared/clients/kinesis-video'

import {
  CreateSignalingChannelCommand,
  CreateStreamCommand,
  GetSignalingChannelEndpointCommand
} from '@aws-sdk/client-kinesis-video'

import { KinesisVideoSignalingClient, GetIceServerConfigCommand } from '@aws-sdk/client-kinesis-video-signaling'

const logger = getLogger()

const kinesisVideoClient = kinesisVideo()

export const createStreamChannelHandler: APIGatewayProxyHandler = async (event, context) => {
  logger.info('createStreamChannel', { event, context })

  // Parse request body
  const body = event.body ? JSON.parse(event.body) : {}
  const streamName = body.streamName || `stream-${Date.now()}`

  try {
    // 1. Create Kinesis Video Stream
    const createStreamResponse = await kinesisVideoClient.send(
      new CreateStreamCommand({
        DeviceName: body.deviceName || 'browser-device',
        StreamName: streamName,
        DataRetentionInHours: 24,
        MediaType: 'video/h264'
      })
    )

    // 2. Create Signaling Channel with same name for WebRTC
    const createSignalingResponse = await kinesisVideoClient.send(
      new CreateSignalingChannelCommand({
        ChannelName: streamName,
        ChannelType: 'SINGLE_MASTER'
      })
    )

    // 3. Get Signaling Channel Endpoints
    const endpoints = await kinesisVideoClient.send(
      new GetSignalingChannelEndpointCommand({
        ChannelARN: createSignalingResponse.ChannelARN,
        SingleMasterChannelEndpointConfiguration: {
          Protocols: ['WSS', 'HTTPS'],
          Role: 'MASTER'
        }
      })
    )

    // 4. Get ICE Server Config for WebRTC
    const signalingClient = new KinesisVideoSignalingClient({
      region: process.env.AWS_REGION,
      endpoint: endpoints.ResourceEndpointList?.find((e) => e.Protocol === 'HTTPS')?.ResourceEndpoint
    })

    const iceServers = await signalingClient.send(
      new GetIceServerConfigCommand({
        ChannelARN: createSignalingResponse.ChannelARN
      })
    )

    logger.info('Stream and signaling channel created successfully', {
      streamArn: createStreamResponse.StreamARN,
      channelArn: createSignalingResponse.ChannelARN
    })

    // 5. Return all necessary info for browser client
    return {
      statusCode: 200,
      body: JSON.stringify({
        streamArn: createStreamResponse.StreamARN,
        channelArn: createSignalingResponse.ChannelARN,
        streamName: streamName,
        wsEndpoint: endpoints.ResourceEndpointList?.find((e) => e.Protocol === 'WSS')?.ResourceEndpoint,
        httpsEndpoint: endpoints.ResourceEndpointList?.find((e) => e.Protocol === 'HTTPS')?.ResourceEndpoint,
        iceServers: iceServers.IceServerList
      })
    }
  } catch (error) {
    logger.error('Error creating stream channel', { error })
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to create stream channel'
      })
    }
  }
}
