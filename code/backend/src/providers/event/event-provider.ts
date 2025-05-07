import { EventType } from './events-dto.js'

export interface EventProvider {
  sendEvent(eventType: EventType, payload: unknown): Promise<void>
}
