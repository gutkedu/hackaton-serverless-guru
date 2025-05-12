export interface TopicsProvider {
  publish(topic: string, message: string): Promise<void>
  subscribe(topic: string): Promise<void>
}
