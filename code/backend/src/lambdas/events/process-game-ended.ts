import { getLogger } from '@/shared/logger/get-logger.js'
import middy from '@middy/core'
import { makeProcessGameEndedEventUseCase } from '@/use-cases/factories/make-process-game-ended-event.js'
import { z } from 'zod'
import { EventBridgeType } from '@/providers/event/events-dto.js'
import { GameEventType } from '@/core/events/game-events.js'
import { GameEndedDetail } from '@/providers/event/events-detail.js'

const logger = getLogger()

const playerResultSchema = z.object({
  username: z.string(),
  wpm: z.number(),
  progress: z.number().optional()
})

const gameEventDataSchema = z.object({
  gameId: z.string(),
  lobbyId: z.string(),
  players: z.array(playerResultSchema),
  winner: playerResultSchema.optional(),
  type: z.nativeEnum(GameEventType),
  timestamp: z.number()
})

const gameEndedEventDetailSchema = z.object({
  data: gameEventDataSchema
})

const gameEndedEventSchema = z.object({
  version: z.string(),
  id: z.string(),
  'detail-type': z.literal(EventBridgeType.GAME_ENDED),
  source: z.string(),
  account: z.string(),
  time: z.string(),
  region: z.string(),
  resources: z.array(z.unknown()),
  detail: gameEndedEventDetailSchema
})

type GameEndedEventType = z.infer<typeof gameEndedEventSchema>

const handler = async (event: GameEndedEventType): Promise<void> => {
  logger.info('Received gameEnded event', { rawEvent: event })

  const parsedEvent = gameEndedEventSchema.safeParse(event)

  if (!parsedEvent.success) {
    logger.error('Invalid gameEnded event structure', { error: parsedEvent.error.flatten(), eventDetail: event.detail })
    throw new Error('Invalid gameEnded event structure')
  }

  const useCase = makeProcessGameEndedEventUseCase()

  const gameEndedDetail: GameEndedDetail = {
    data: parsedEvent.data.detail.data
  }

  await useCase.execute(gameEndedDetail)

  logger.info('Successfully processed gameEnded event')
}

export const processGameEndedHandler = middy(handler).onError((request) => {
  const { error } = request
  logger.error('Error processing gameEnded event', { error })
  throw error
})
