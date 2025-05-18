import { api } from "./api";

export interface GameEndRequest {
  lobbyId: string;
  players: Array<{
    username: string;
    wpm: number;
    progress: number;
  }>;
}

export interface GameEndResponse {
  success: boolean;
  winner?: {
    username: string;
    wpm: number;
  };
  message: string;
}

class GameService {
  /**
   * Send game end data to the backend
   */
  async endGame(request: GameEndRequest, idToken: string): Promise<void> {
    try {
      console.log('GameService: Starting endGame request with data:', {
        lobbyId: request.lobbyId,
        playersCount: request.players.length,
        players: request.players
      });

      if (!request.lobbyId) {
        throw new Error("Lobby ID is required");
      }

      if (!Array.isArray(request.players)) {
        throw new Error("Players must be an array and is required");
      }

      // Validate each player has required fields
      for (const player of request.players) {
        if (
          !player.username ||
          typeof player.wpm !== "number" ||
          typeof player.progress !== "number"
        ) {
          throw new Error(
            "Each player must have username, wpm, and progress properties"
          );
        }
      }

      console.log('GameService: Validation passed, sending request to API');
      await api("/game/end", {
        method: "POST",
        body: request,
        token: `Bearer ${idToken}`,
      });
      console.log('GameService: Successfully sent game end request');
    } catch (error) {
      console.error("GameService: Error ending game:", error);
      throw error;
    }
  }
}

export const gameService = new GameService();
