import { TopicClient, TopicItem, TopicConfigurations, CredentialProvider, TopicSubscribeResponse } from '@gomomento/sdk-web';
import { GameEvent } from './types/game-events';

export interface MomentoConfig {
  token: string;
  endpoint: string;
  cacheName: string;
}

export class MomentoService {
  private static instance: MomentoService;
  private topicClient: TopicClient | null = null;
  private subscriptions: Map<string, any> = new Map();
  private cacheName: string | null = null;

  private constructor() {}

  static getInstance(): MomentoService {
    if (!MomentoService.instance) {
      MomentoService.instance = new MomentoService();
    }
    return MomentoService.instance;
  }

  async initialize(config: MomentoConfig) {
    if (!this.topicClient) {
      this.topicClient = new TopicClient({
        configuration: TopicConfigurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString(config.token)
      });
      this.cacheName = config.cacheName;
    }
  }

  async subscribeToLobby(
    lobbyId: string,
    onEvent: (event: GameEvent) => void,
    onError: (error: Error) => void
  ) {
    if (!this.topicClient) {
      throw new Error('Momento client not initialized');
    }

    if (!this.cacheName) {
      throw new Error('Cache name not set');
    }

    const topicName = `lobby-${lobbyId}`;
    
    try {
      // Unsubscribe from any existing subscription for this lobby
      await this.unsubscribeFromLobby(lobbyId);

      const response = await this.topicClient.subscribe(
        this.cacheName,
        topicName,
        {
          onItem: (item: TopicItem) => {
            try {
              const value = item.value();
              // Handle both string and Uint8Array values
              const valueString = typeof value === 'string' ? value : new TextDecoder().decode(value);
              const event = JSON.parse(valueString) as GameEvent;
              onEvent(event);
            } catch (err) {
              console.error('Error parsing game event:', err);
              onError(err instanceof Error ? err : new Error('Failed to parse game event'));
            }
          },
          onError: (err: any) => {
            console.error('Subscription error:', err);
            onError(new Error(err?.message || 'Unknown subscription error'));
          }
        }
      );

      if (response.type === TopicSubscribeResponse.Error) {
        const errorMessage = String(response);
        throw new Error(`Failed to subscribe: ${errorMessage}`);
      }

      this.subscriptions.set(lobbyId, response);
      console.log(`Subscribed to lobby ${lobbyId}`);
    } catch (err) {
      console.error('Failed to subscribe to lobby:', err);
      throw err;
    }
  }

  async unsubscribeFromLobby(lobbyId: string) {
    const subscription = this.subscriptions.get(lobbyId);
    if (subscription) {
      try {
        await subscription.unsubscribe();
        this.subscriptions.delete(lobbyId);
        console.log(`Unsubscribed from lobby ${lobbyId}`);
      } catch (err) {
        console.error('Error unsubscribing from lobby:', err);
      }
    }
  }

  async unsubscribeFromAll() {
    const promises = Array.from(this.subscriptions.entries()).map(([lobbyId]) => 
      this.unsubscribeFromLobby(lobbyId)
    );
    await Promise.all(promises);
  }
} 