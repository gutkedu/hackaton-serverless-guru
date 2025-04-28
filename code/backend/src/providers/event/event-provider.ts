import { EventType } from './events-dto'

export interface EventProvider {
  sendEvent(eventType: EventType, payload: unknown): Promise<void>
}
