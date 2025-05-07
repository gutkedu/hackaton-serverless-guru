export interface TopicsProvider {
  publish(topic: string, message: string): Promise<void>
}
