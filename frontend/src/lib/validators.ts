import { z } from "zod";

/**
 * Schema for channel creation form
 */
export const createChannelSchema = z.object({
  streamName: z.string().min(3, "Stream name must be at least 3 characters"),
  deviceName: z.string().optional(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

/**
 * Schema for API responses
 */
export const channelResponseSchema = z.object({
  streamArn: z.string(),
  channelArn: z.string(),
  streamName: z.string(),
  wsEndpoint: z.string().optional(),
  httpsEndpoint: z.string().optional(),
  iceServers: z
    .array(
      z.object({
        username: z.string().optional(),
        credential: z.string().optional(),
        ttl: z.number().optional(),
        uris: z.array(z.string()),
      })
    )
    .optional(),
});

export type ChannelResponse = z.infer<typeof channelResponseSchema>;
