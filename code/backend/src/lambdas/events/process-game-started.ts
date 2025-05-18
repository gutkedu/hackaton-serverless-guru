import { getLogger } from '@/shared/logger/get-logger.js'
import middy from '@middy/core'
import { makeProcessGameStartedEventUseCase } from '@/use-cases/factories/make-process-game-started-event.js'
import { z } from 'zod'

const logger = getLogger()

const gameStartedEventDetailSchema = z.object({
  data: z.object({
    lobbyId: z.string(),
    gameId: z.string(),
    timestamp: z.union([z.number(), z.string()]),
    type: z.string(),
    content: z.string().optional()
  })
})

const gameStartedEventSchema = z.object({
  version: z.string(),
  id: z.string(),
  'detail-type': z.literal('gameStarted'),
  source: z.string(),
  account: z.string(),
  time: z.string(),
  region: z.string(),
  resources: z.array(z.unknown()),
  detail: gameStartedEventDetailSchema
})

type GameStartedEventType = z.infer<typeof gameStartedEventSchema>

const handler = async (event: GameStartedEventType): Promise<void> => {
  logger.info('Received gameStarted event', { rawEvent: event })

  const parsedEvent = gameStartedEventSchema.safeParse(event)

  if (!parsedEvent.success) {
    logger.error('Invalid gameStarted event structure', {
      error: parsedEvent.error.flatten(),
      eventDetail: event.detail
    })
    throw new Error('Invalid gameStarted event structure')
  }

  const useCase = makeProcessGameStartedEventUseCase()
  await useCase.execute(parsedEvent.data.detail)

  logger.info('Successfully processed gameStarted event')
}

export const processGameStartedHandler = middy(handler).onError((error) => {
  logger.error('Error processing gameStarted event', { error })
  throw error
})
