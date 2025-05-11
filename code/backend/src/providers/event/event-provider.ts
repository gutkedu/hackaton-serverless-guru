import { EventBridgeType } from './events-dto.js'

export interface EventProvider {
  sendEvent(eventType: EventBridgeType, payload: unknown): Promise<void>
}
