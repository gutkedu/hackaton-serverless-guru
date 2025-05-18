import { TopicClient, TopicItem, TopicConfigurations, CredentialProvider, TopicSubscribeResponse, TopicPublishResponse } from '@gomomento/sdk-web';
import { GameEvent, GameEndedEvent, GameEventType } from './types/game-events';
import { gameService } from './game-service';

export interface MomentoConfig {
  token: string;
  endpoint: string;
  cacheName: string;
}

export class MomentoService {
  private static instance: MomentoService;
  private topicClient: TopicClient | null = null;
  private subscriptions: Map<string, any> = new Map(); // Key is topicName
  private cacheName: string | null = null;
  private idToken: string | null = null;

  private constructor() {}

  static getInstance(): MomentoService {
    if (!MomentoService.instance) {
      MomentoService.instance = new MomentoService();
    }
    return MomentoService.instance;
  }

  async initialize(config: MomentoConfig, idToken: string) {
    if (!this.topicClient) {
      this.topicClient = new TopicClient({
        configuration: TopicConfigurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString(config.token)
      });
      this.cacheName = config.cacheName;
      this.idToken = idToken;
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
      // Check if we already have an active subscription for this topic
      if (this.subscriptions.has(topicName)) {
        console.log(`Already subscribed to topic ${topicName}`);
        return;
      }

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

      this.subscriptions.set(topicName, response);
      console.log(`Subscribed to topic ${topicName}`);
    } catch (err) {
      console.error(`Failed to subscribe to topic ${topicName}:`, err);
      throw err;
    }
  }

  async unsubscribeFromLobby(lobbyId: string) {
    const topicName = `lobby-${lobbyId}`;
    const subscription = this.subscriptions.get(topicName);
    if (subscription) {
      try {
        await subscription.unsubscribe();
        this.subscriptions.delete(topicName);
        console.log(`Unsubscribed from topic ${topicName}`);
      } catch (err) {
        console.error(`Error unsubscribing from topic ${topicName}:`, err);
      }
    }
  }

  async subscribeToGame(
    gameId: string,
    onEvent: (event: GameEvent) => void,
    onError: (error: Error) => void
  ) {
    if (!this.topicClient) {
      throw new Error('Momento client not initialized');
    }

    if (!this.cacheName) {
      throw new Error('Cache name not set');
    }

    const topicName = `game-${gameId}`;

    try {
      if (this.subscriptions.has(topicName)) {
        console.log(`Already subscribed to topic ${topicName}`);
        return;
      }

      const response = await this.topicClient.subscribe(
        this.cacheName,
        topicName,
        {
          onItem: async (item: TopicItem) => {
            try {
              const value = item.value();
              const valueString = typeof value === 'string' ? value : new TextDecoder().decode(value);
              console.log('Received game event:', valueString); // Debug log
              const event = JSON.parse(valueString) as GameEvent;
              console.log('Parsed game event:', event); // Debug log
              
              // Just pass the event to the handler, don't make API calls here
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

      this.subscriptions.set(topicName, response);
      console.log(`Subscribed to topic ${topicName}`);
    } catch (err) {
      console.error(`Failed to subscribe to topic ${topicName}:`, err);
      throw err;
    }
  }

  async unsubscribeFromGame(gameId: string) {
    const topicName = `game-${gameId}`;
    const subscription = this.subscriptions.get(topicName);
    if (subscription) {
      try {
        await subscription.unsubscribe();
        this.subscriptions.delete(topicName);
        console.log(`Unsubscribed from topic ${topicName}`);
      } catch (err) {
        console.error(`Error unsubscribing from topic ${topicName}:`, err);
      }
    }
  }

  async unsubscribeFromAll() {
    const promises = Array.from(this.subscriptions.values()).map(subscription => 
      subscription.unsubscribe().catch((err: any) => {
        console.error('Error during individual topic unsubscription in unsubscribeFromAll:', err);
      })
    );
    try {
      await Promise.all(promises);
    } catch (err) {
      console.error('Error unsubscribing from all topics during Promise.all:', err);
    }
    this.subscriptions.clear();
    console.log('Unsubscribed from all topics and cleared subscriptions map.');
  }

  async publish(topicName: string, message: string) {
    if (!this.topicClient) {
      throw new Error('Momento client not initialized');
    }

    if (!this.cacheName) {
      throw new Error('Cache name not set');
    }

    const response = await this.topicClient.publish(this.cacheName, topicName, message);
    if (response.type === TopicPublishResponse.Error) {
      throw new Error(`Failed to publish message: ${response}`);
    }
  }
} 